import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KeepersService {
  constructor(private prisma: PrismaService) {}

  upsert(address: string, stake: string) {
    return this.prisma.keeper.upsert({
      where: { address },
      create: { address, stake: BigInt(stake) },
      update: { stake: BigInt(stake) },
    });
  }

  findAll() {
    return this.prisma.keeper.findMany({ orderBy: { reputationScore: 'desc' } });
  }

  findOne(address: string) {
    return this.prisma.keeper.findUniqueOrThrow({ where: { address }, include: { executions: { take: 10, orderBy: { executedAt: 'desc' } } } });
  }

  updateReputation(address: string, success: boolean) {
    return this.prisma.keeper.update({
      where: { address },
      data: {
        totalExecutions: { increment: 1 },
        failedExecutions: success ? undefined : { increment: 1 },
        reputationScore: success ? { increment: 1 } : { decrement: 5 },
      },
    });
  }
}
