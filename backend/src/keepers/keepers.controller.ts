import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { KeepersService } from './keepers.service';

class RegisterKeeperDto { @IsString() address!: string; @IsString() stake!: string; }

@ApiTags('keepers')
@Controller('keepers')
export class KeepersController {
  constructor(private readonly keepers: KeepersService) {}

  @Post('register') register(@Body() dto: RegisterKeeperDto) { return this.keepers.upsert(dto.address, dto.stake); }
  @Get() findAll() { return this.keepers.findAll(); }
  @Get(':address') findOne(@Param('address') address: string) { return this.keepers.findOne(address); }
}
