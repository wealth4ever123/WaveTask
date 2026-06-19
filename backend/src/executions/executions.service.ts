import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsNumber, IsString, IsBoolean } from 'class-validator';

export class CreateExecutionDto {
  @IsNumber() taskId!: number;
  @IsString() keeperAddr!: string;
  @IsString() txHash!: string;
  @IsBoolean() success!: boolean;
  @IsString() rewardPaid!: string;
}

@Injectable()
export class ExecutionsService {
  constructor(private prisma: PrismaService) {}

  record(dto: CreateExecutionDto) {
    return this.prisma.execution.create({
      data: { ...dto, rewardPaid: BigInt(dto.rewardPaid) },
    });
  }

  findByTask(taskId: number) {
    return this.prisma.execution.findMany({ where: { taskId }, orderBy: { executedAt: 'desc' } });
  }

  findByKeeper(keeperAddr: string) {
    return this.prisma.execution.findMany({ where: { keeperAddr }, orderBy: { executedAt: 'desc' } });
  }
}
