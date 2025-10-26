import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ImportService } from '../imports/import.service';
import { PlayerDiscoveryService } from './player-discovery.service';
import { GameDiscoveryService } from './game-discovery.service';

/**
 * Service that wires up discovery services to ImportService
 * Needed to avoid circular dependencies
 */
@Injectable()
export class ImportConfigService implements OnModuleInit {
  private readonly logger = new Logger(ImportConfigService.name);

  constructor(
    private readonly importService: ImportService,
    private readonly playerDiscoveryService: PlayerDiscoveryService,
    private readonly gameDiscoveryService: GameDiscoveryService,
  ) {}

  onModuleInit() {
    // Wire up discovery services to ImportService
    this.importService.setPlayerDiscoveryService(this.playerDiscoveryService);
    this.importService.setGameDiscoveryService(this.gameDiscoveryService);
    this.logger.log('Wired up PlayerDiscoveryService and GameDiscoveryService to ImportService');
  }
}
