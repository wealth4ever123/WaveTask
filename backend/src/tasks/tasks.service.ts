import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './tasks.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        ...dto,
        rewardXlm: BigInt(dto.rewardXlm),
        executeAfter: new Date(dto.executeAfter),
      },
    });
  }

  findAll(status?: string) {
    return this.prisma.task.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { executions: { take: 1, orderBy: { executedAt: 'desc' } } },
    });
  }

  findOne(id: number) {
    return this.prisma.task.findUniqueOrThrow({ where: { id }, include: { executions: true } });
  }

  findByOnChainId(onChainId: number) {
    return this.prisma.task.findUnique({ where: { onChainId } });
  }

  updateStatus(onChainId: number, status: string, keeperAddr?: string) {
    return this.prisma.task.update({
      where: { onChainId },
      data: {
        status,
        executedAt: status === 'Executed' ? new Date() : undefined,
        executedByKeeper: keeperAddr,
      },
    });
  }

  stats() {
    return this.prisma.task.groupBy({
      by: ['status'],
      _count: { status: true },
    });
  }
}
