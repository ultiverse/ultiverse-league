import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getInfo() {
    return {
      name: 'Ultiverse League API',
      version: '1.0.0',
      status: 'running',
    };
  }
}
