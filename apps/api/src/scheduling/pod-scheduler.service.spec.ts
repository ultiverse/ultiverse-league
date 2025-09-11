import { Test, TestingModule } from '@nestjs/testing';
import { PodSchedulerService } from './pod-scheduler.service';

describe('PodSchedulerService', () => {
  let service: PodSchedulerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PodSchedulerService],
    }).compile();

    service = module.get<PodSchedulerService>(PodSchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
