/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { UCTeamsService } from './uc.teams.service';
import { UCClient } from '../uc.client';

// Make param mapping predictable for assertions
jest.mock('../types/teams', () => ({
  __esModule: true,
  toUcTeamsParams: (p: any) => ({ __teams: true, ...p }),
}));

describe('UCTeamsService', () => {
  let service: UCTeamsService;

  const clientMock = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UCTeamsService, { provide: UCClient, useValue: clientMock }],
    }).compile();

    service = module.get(UCTeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('list() forwards mapped params to UCClient.get("/api/teams") and returns the response', async () => {
    clientMock.get.mockResolvedValueOnce({
      result: [{ id: 10, name: 'Alpha' }],
    });

    const res = await service.list({ event_id: 42, page: 2, per_page: 50 });

    expect(clientMock.get).toHaveBeenCalledTimes(1);
    expect(clientMock.get).toHaveBeenCalledWith('/api/teams', {
      __teams: true,
      event_id: 42,
      page: 2,
      per_page: 50,
    });
    expect(res).toEqual({ result: [{ id: 10, name: 'Alpha' }] });
  });
});
