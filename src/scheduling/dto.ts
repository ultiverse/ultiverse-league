import { IsArray, IsInt, IsOptional, Min } from 'class-validator';

export class ScheduleRequestDto {
  @IsArray()
  pods!: string[];

  @IsInt()
  @Min(1)
  rounds!: number;

  @IsOptional()
  recencyWindow?: number;
}
