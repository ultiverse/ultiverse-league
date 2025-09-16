import { Test, TestingModule } from '@nestjs/testing';
import { UCRegistrationsService } from './uc.registrations.service';

describe('UCRegistrationsService', () => {
  let service: UCRegistrationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UCRegistrationsService],
    }).compile();

    service = module.get<UCRegistrationsService>(UCRegistrationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
