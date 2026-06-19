import { Controller, Get, Post, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './tasks.dto';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post() create(@Body() dto: CreateTaskDto) { return this.tasks.create(dto); }
  @Get() findAll(@Query('status') status?: string) { return this.tasks.findAll(status); }
  @Get('stats') stats() { return this.tasks.stats(); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.tasks.findOne(id); }
}
