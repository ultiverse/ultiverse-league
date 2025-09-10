/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsArray,
  IsInt,
  IsOptional,
  IsIn,
  Min,
  IsObject,
  IsString,
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

export class PodScheduleByIdsDto {
  @IsArray() podIds!: string[];
  @IsInt() @Min(1) rounds!: number;
  @IsOptional() recencyWindow?: number;
  @IsOptional() @IsObject() history?: ScheduleInput['history'];
  @IsOptional() @IsObject() skill?: ScheduleInput['skill'];
  @IsOptional()
  @IsIn(['each-vs-both', 'one-each'])
  pairingMode?: 'each-vs-both' | 'one-each';
}

export class PodScheduleByLeagueDto {
  @IsString() leagueId!: string;
  @IsInt() @Min(1) rounds!: number;
  @IsOptional() recencyWindow?: number;
  @IsOptional() @IsObject() history?: ScheduleInput['history'];
  @IsOptional() @IsObject() skill?: ScheduleInput['skill'];
  @IsOptional()
  @IsIn(['each-vs-both', 'one-each'])
  pairingMode?: 'each-vs-both' | 'one-each';
}
