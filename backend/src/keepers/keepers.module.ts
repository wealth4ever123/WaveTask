import { Module } from '@nestjs/common';
import { KeepersService } from './keepers.service';
import { KeepersController } from './keepers.controller';

@Module({ providers: [KeepersService], controllers: [KeepersController], exports: [KeepersService] })
export class KeepersModule {}
