import { Test, TestingModule } from '@nestjs/testing';
import { UCEventsService } from './uc.events.service';

describe('UCEventsService', () => {
  let service: UCEventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UCEventsService],
    }).compile();

    service = module.get<UCEventsService>(UCEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
