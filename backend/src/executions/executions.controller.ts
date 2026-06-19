import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExecutionsService, CreateExecutionDto } from './executions.service';

@ApiTags('executions')
@Controller('executions')
export class ExecutionsController {
  constructor(private readonly executions: ExecutionsService) {}

  @Post() record(@Body() dto: CreateExecutionDto) { return this.executions.record(dto); }
  @Get('task/:taskId') byTask(@Param('taskId', ParseIntPipe) id: number) { return this.executions.findByTask(id); }
  @Get('keeper/:addr') byKeeper(@Param('addr') addr: string) { return this.executions.findByKeeper(addr); }
}
