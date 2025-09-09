import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { expandBlock, PairingMode } from '../scheduling/uc-transform';
import { UCService } from './uc.service';

@Controller('uc')
export class UCController {
  constructor(
    private cfg: ConfigService,
    private uc: UCService,
  ) {}

  @Get('me')
  async me() {
    const domain = this.cfg.get<string>('UC_API_DOMAIN')!;
    // in the future, fetch OAuth token here
    return this.uc.me(domain, 'TOKEN_PLACEHOLDER');
  }

  @Post('games/preview')
  preview(
    @Body()
    body: {
      blocks: { a: string; b: string; c: string; d: string }[];
      mode?: PairingMode;
    },
  ) {
    const mode = body.mode ?? 'each-vs-both';
    const games = body.blocks.flatMap((b) => expandBlock(b, mode));
    return { count: games.length, games };
  }
}
