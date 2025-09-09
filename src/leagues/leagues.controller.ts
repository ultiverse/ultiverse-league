import { Controller, Get, Param, Query } from '@nestjs/common';
import { LeaguesService } from './leagues.service';

@Controller('leagues')
export class LeaguesController {
  constructor(private svc: LeaguesService) {}
  @Get('latest') latest() {
    return this.svc.latest();
  }
  @Get('recent') recent(@Query('limit') limit?: string) {
    return this.svc.recent(limit ? Number(limit) : 10);
  }
  @Get(':id') byId(@Param('id') id: string) {
    return this.svc.get(id);
  }
}
