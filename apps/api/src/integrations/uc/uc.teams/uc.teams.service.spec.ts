import { Test, TestingModule } from '@nestjs/testing';
import { UCTeamsService } from './uc.teams.service';

describe('UCTeamsService', () => {
  let service: UCTeamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UCTeamsService],
    }).compile();

    service = module.get<UCTeamsService>(UCTeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
