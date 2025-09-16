/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { UCEventsService } from './uc.events.service';
import { UCClient } from '../uc.client';

// Map helper mocked so we can assert exact params shape
jest.mock('../types/events', () => ({
  __esModule: true,
  toUcEventsParams: (p: any) => ({ __events: true, ...p }),
}));

describe('UCEventsService', () => {
  let service: UCEventsService;

  const clientMock = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UCEventsService, { provide: UCClient, useValue: clientMock }],
    }).compile();

    service = module.get(UCEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('list() forwards mapped params to UCClient.get("/api/events")', async () => {
    clientMock.get.mockResolvedValueOnce({ result: [] });

    const res = await service.list({ search: 'Summer', page: 2 });

    expect(clientMock.get).toHaveBeenCalledTimes(1);
    expect(clientMock.get).toHaveBeenCalledWith('/api/events', {
      __events: true,
      search: 'Summer',
      page: 2,
    });
    expect(res).toEqual({ result: [] });
  });

  it('getById() returns the first result row when present', async () => {
    clientMock.get.mockResolvedValueOnce({
      result: [{ id: 42, name: 'League 42' }],
    });

    const row = await service.getById(42);

    expect(clientMock.get).toHaveBeenCalledWith('/api/events', {
      __events: true,
      id: 42,
    });
    expect(row).toEqual({ id: 42, name: 'League 42' });
  });

  it('getById() returns null when no row is found', async () => {
    clientMock.get.mockResolvedValueOnce({ result: [] });

    const row = await service.getById(123);

    expect(clientMock.get).toHaveBeenCalledWith('/api/events', {
      __events: true,
      id: 123,
    });
    expect(row).toBeNull();
  });
});
