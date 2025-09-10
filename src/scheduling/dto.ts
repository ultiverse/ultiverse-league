import {
  IsArray,
  IsInt,
  IsOptional,
  IsIn,
  Min,
  IsObject,
} from 'class-validator';
import { ScheduleInput } from './types';

export class ScheduleRequestDto {
  @IsArray() pods!: string[];
  @IsInt() @Min(1) rounds!: number;

  @IsOptional() recencyWindow?: number;

  @IsOptional() @IsObject() history?: ScheduleInput['history'];

  @IsOptional() @IsObject() skill?: ScheduleInput['skill'];

  @IsOptional()
  @IsIn(['each-vs-both', 'one-each'])
  pairingMode?: 'each-vs-both' | 'one-each';
}
