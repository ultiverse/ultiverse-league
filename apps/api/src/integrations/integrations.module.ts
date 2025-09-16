import { Module } from '@nestjs/common';
import { UCService } from './uc.service';
import { UCModule } from './uc/uc.module';

@Module({
  providers: [UCService],
  exports: [UCService],
  imports: [UCModule],
})
export class IntegrationsModule {}
