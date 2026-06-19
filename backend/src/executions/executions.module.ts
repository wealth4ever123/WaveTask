import { Module } from '@nestjs/common';
import { ExecutionsService } from './executions.service';
import { ExecutionsController } from './executions.controller';

@Module({ providers: [ExecutionsService], controllers: [ExecutionsController] })
export class ExecutionsModule {}
