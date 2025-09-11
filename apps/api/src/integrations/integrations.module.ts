import { Module } from '@nestjs/common';
import { UCController } from './uc.controller';
import { UCService } from './uc.service';

@Module({
  controllers: [UCController],
  providers: [UCService],
  exports: [UCService],
})
export class IntegrationsModule {}
