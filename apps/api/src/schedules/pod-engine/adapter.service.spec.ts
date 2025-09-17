import { Test } from '@nestjs/testing';
import { PodEngineAdapter } from './adapter.service';
import { POD_SCHEDULER } from './tokens';
import { PodSchedulerService } from './podscheduler.service';

describe('AdapterService', () => {
  let adapter: PodEngineAdapter;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: POD_SCHEDULER, useClass: PodSchedulerService }, // bind token
        PodEngineAdapter,
      ],
    }).compile();

    adapter = moduleRef.get(PodEngineAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });
});
