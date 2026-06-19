import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { KeepersModule } from './keepers/keepers.module';
import { ExecutionsModule } from './executions/executions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    TasksModule,
    KeepersModule,
    ExecutionsModule,
  ],
})
export class AppModule {}
