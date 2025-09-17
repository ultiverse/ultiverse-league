import { Module } from '@nestjs/common';
import { UCAdapter } from './uc/uc.adapter';
import { TEAMS_PROVIDER } from './ports';

@Module({
  providers: [UCAdapter, { provide: TEAMS_PROVIDER, useExisting: UCAdapter }],
  exports: [TEAMS_PROVIDER],
})
export class IntegrationsModule {}
