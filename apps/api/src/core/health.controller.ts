import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  ping() {
    return { status: 'ok', uptime: process.uptime() };
  }
}
