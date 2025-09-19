import {
  Controller,
  Get,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Post,
  Body,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { GeneratePodsDto } from './dto/generate-pods.dto';
import { ScheduleView } from '@ultiverse/shared-types';

@Controller()
export class SchedulesController {
  constructor(private readonly service: SchedulesService) {}

  // GET /leagues/:leagueId/schedule?source=fixtures|uc&eventId=123&rounds=6
  @Get('leagues/:leagueId/schedule')
  async getLeagueSchedule(
    @Param('leagueId') leagueId: string,
    @Query('source') source: 'fixtures' | 'uc' = 'fixtures',
    @Query('eventId') eventId?: string,
    @Query('rounds', new DefaultValuePipe(6), ParseIntPipe) rounds?: number,
  ): Promise<ScheduleView> {
    return this.service.getLeagueSchedule(
      leagueId,
      source ?? 'fixtures',
      rounds ?? 6,
      eventId,
    );
  }

  // POST /schedules/pods/generate
  @Post('schedules/pods/generate')
  async generatePods(@Body() dto: GeneratePodsDto): Promise<ScheduleView> {
    return this.service.generatePodsView(dto.pods, {
      rounds: dto.rounds,
      recencyWindow: dto.recencyWindow,
      pairingMode: dto.pairingMode,
      names: dto.names,
      leagueId: dto.leagueId,
    });
  }
}
