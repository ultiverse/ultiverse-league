import { Test, TestingModule } from '@nestjs/testing';
import { UCGamesService } from './uc.games.service';
import { UCClient } from '../uc.client';

describe('UCGamesService', () => {
  let service: UCGamesService;

  const clientMock = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UCGamesService, { provide: UCClient, useValue: clientMock }],
    }).compile();

    service = module.get(UCGamesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('list() forwards mapped params to UCClient.get("/api/games") and returns the response', async () => {
    clientMock.get.mockResolvedValueOnce({ result: [{ id: 99 }] });

    const res = await service.list({
      event_id: 42,
      per_page: 5,
      status: ['scheduled'],
    });

    expect(clientMock.get).toHaveBeenCalledTimes(1);
    expect(clientMock.get).toHaveBeenCalledWith('/api/games', {
      event_id: 42,
      per_page: 5,
      status: 'scheduled', // Arrays are converted to comma-separated strings
    });
    expect(res).toEqual({ result: [{ id: 99 }] });
  });
});
