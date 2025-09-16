import { Test, TestingModule } from '@nestjs/testing';
import { UCGamesService } from './uc.games.service';

describe('UCGamesService', () => {
  let service: UCGamesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UCGamesService],
    }).compile();

    service = module.get<UCGamesService>(UCGamesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
