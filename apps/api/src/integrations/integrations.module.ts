import { Module } from '@nestjs/common';
import { UCModule } from './uc/uc.module';

@Module({
  imports: [UCModule],
})
export class IntegrationsModule {}
