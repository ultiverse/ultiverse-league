import { Module } from '@nestjs/common';
import { UCService } from './uc.service';
import { UCController } from './uc.controller';

@Module({
  providers: [UCService],
  controllers: [UCController],
})
export class IntegrationsModule {}
