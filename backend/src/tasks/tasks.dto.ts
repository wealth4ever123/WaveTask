import { IsString, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TriggerType {
  TIME = 'Time',
  CONDITION = 'Condition',
  ORACLE = 'Oracle',
}

export class CreateTaskDto {
  @ApiProperty() @IsNumber() onChainId!: number;
  @ApiProperty() @IsString() creator!: string;
  @ApiProperty() @IsString() targetContract!: string;
  @ApiProperty({ enum: TriggerType }) @IsEnum(TriggerType) triggerType!: TriggerType;
  @ApiProperty() @IsString() triggerData!: string;
  @ApiProperty() @IsString() rewardXlm!: string;
  @ApiProperty() @IsDateString() executeAfter!: string;
}
