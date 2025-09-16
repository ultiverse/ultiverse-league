import { Test, TestingModule } from '@nestjs/testing';
import { UCRegistrationsService } from './uc.registrations.service';
import { UCClient } from '../uc.client';

describe('UCRegistrationsService', () => {
  let service: UCRegistrationsService;
  const clientMock = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UCRegistrationsService,
        { provide: UCClient, useValue: clientMock },
      ],
    }).compile();

    service = module.get(UCRegistrationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('list(eventId, includePerson=true) calls UCClient.get with fields=Person', async () => {
    clientMock.get.mockResolvedValueOnce({ result: [{ id: 1 }] });

    const res = await service.list(156458, true);

    expect(clientMock.get).toHaveBeenCalledTimes(1);
    expect(clientMock.get).toHaveBeenCalledWith('/api/registrations', {
      event_id: 156458,
      fields: 'Person',
    });
    expect(res).toEqual({ result: [{ id: 1 }] });
  });

  it('list(eventId, includePerson=false) omits fields', async () => {
    clientMock.get.mockResolvedValueOnce({ result: [] });

    await service.list(123, false);

    expect(clientMock.get).toHaveBeenCalledWith('/api/registrations', {
      event_id: 123,
    });
  });
});
