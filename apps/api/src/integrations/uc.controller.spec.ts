import { Test, TestingModule } from '@nestjs/testing';
import { UcController } from './uc.controller';

describe('UcController', () => {
  let controller: UcController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UcController],
    }).compile();

    controller = module.get<UcController>(UcController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
