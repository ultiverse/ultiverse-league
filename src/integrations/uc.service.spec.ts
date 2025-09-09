import { Test, TestingModule } from '@nestjs/testing';
import { UcService } from './uc.service';

describe('UcService', () => {
  let service: UcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UcService],
    }).compile();

    service = module.get<UcService>(UcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
