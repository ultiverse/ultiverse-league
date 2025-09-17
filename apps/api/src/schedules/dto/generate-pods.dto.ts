import {
  IsArray,
  ArrayMinSize,
  IsInt,
  Min,
  IsOptional,
  IsIn,
  IsObject,
  IsString,
} from 'class-validator';

export class GeneratePodsDto {
  @IsArray()
  @ArrayMinSize(4)
  pods!: string[];

  @IsInt()
  @Min(1)
  rounds!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  recencyWindow?: number;

  @IsOptional()
  @IsIn(['each-vs-both', 'single'])
  pairingMode?: 'each-vs-both' | 'single';

  @IsOptional()
  @IsObject()
  names?: Record<string, string>;

  @IsOptional()
  @IsString()
  leagueId?: string;
}
