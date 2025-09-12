/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { UCService } from './uc.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

// ---- jest mocks ----
const axiosPost = jest.fn();
const axiosGet = jest.fn();

// make axios.create return our instance stub
jest.mock('axios', () => {
  const post = jest.fn();
  const get = jest.fn();
  const instance = { post, get };
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => instance),
    },
    // also export named members for TS types (not used at runtime)
    create: jest.fn(() => instance),
  };
});

// param mapping helpers → predictable outputs for assertions
jest.mock('./uc.types', () => ({
  __esModule: true,
  toUcEventsParams: (p: any) => ({ __events: true, ...p }),
  toUcTeamsParams: (p: any) => ({ __teams: true, ...p }),
  toUcGamesParams: (p: any) => ({ __games: true, ...p }),
}));

describe('UCService', () => {
  let moduleRef: TestingModule;
  let service: UCService;
  let cfgMock: jest.Mocked<ConfigService>;

  // helper to (re)build the service with provided config values
  const build = async (env: Partial<Record<string, string>> = {}) => {
    // reset axios instance function pointers each build
    (axios as any).create.mockReturnValue({
      post: axiosPost,
      get: axiosGet,
    });

    cfgMock = {
      get: jest.fn((key: string, def?: any) => env[key] ?? def),
    } as any;

    moduleRef = await Test.createTestingModule({
      providers: [UCService, { provide: ConfigService, useValue: cfgMock }],
    }).compile();

    service = moduleRef.get(UCService);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // default axios.create wiring
    (axios as any).create.mockReturnValue({
      post: axiosPost,
      get: axiosGet,
    });
  });

  it('constructs axios with normalized baseURL from UC_API_DOMAIN', async () => {
    await build({
      UC_API_DOMAIN: 'http://maul.usetopscore.com////',
      UC_CLIENT_ID: 'id',
      UC_CLIENT_SECRET: 'secret',
    });
    // ensure axios.create called with normalized https:// and striped slashes
    expect((axios as any).create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://maul.usetopscore.com',
        timeout: 15000,
      }),
    );
  });

  it('throws if UC_API_DOMAIN is not set', async () => {
    await expect(
      build({
        UC_API_DOMAIN: '',
        UC_CLIENT_ID: 'id',
        UC_CLIENT_SECRET: 'secret',
      }),
    ).rejects.toThrow('UC_API_DOMAIN is not set');
  });

  it('fetches an access token and caches it for subsequent calls', async () => {
    await build({
      UC_API_DOMAIN: 'api.example.com',
      UC_CLIENT_ID: 'id',
      UC_CLIENT_SECRET: 'secret',
    });

    // 1) token endpoint response
    axiosPost.mockResolvedValueOnce({
      data: { access_token: 'T1', expires_in: 3600 },
    });

    // 2) two authenticated GET calls should reuse same token
    axiosGet
      .mockResolvedValueOnce({ data: { ok: true, me: 'first' } }) // for me()
      .mockResolvedValueOnce({ data: { ok: true, events: [] } }); // for listEvents()

    const me = await service.me();
    expect(me).toEqual({ ok: true, me: 'first' });

    await service.listEvents({ search: 'Summer' });

    // token endpoint called once
    expect(axiosPost).toHaveBeenCalledTimes(1);
    expect(axiosPost).toHaveBeenCalledWith(
      '/api/oauth/server',
      expect.any(URLSearchParams),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );

    // both GETs carry the Authorization header with T1
    const headersPassed = axiosGet.mock.calls.map(
      ([, cfg]) => cfg.headers.Authorization,
    );
    expect(headersPassed).toEqual(['Bearer T1', 'Bearer T1']);

    // listEvents used mapped params
    expect(axiosGet.mock.calls[1][0]).toBe('/api/events');
    expect(axiosGet.mock.calls[1][1].params).toEqual(
      expect.objectContaining({ __events: true, search: 'Summer' }),
    );
  });

  it('retries once on 401 with a fresh token', async () => {
    await build({
      UC_API_DOMAIN: 'api.example.com',
      UC_CLIENT_ID: 'id',
      UC_CLIENT_SECRET: 'secret',
    });

    // first token (then 401), then second token used
    axiosPost
      .mockResolvedValueOnce({ data: { access_token: 'OLD', expires_in: 10 } })
      .mockResolvedValueOnce({
        data: { access_token: 'NEW', expires_in: 3600 },
      });

    // first GET throws a { response: { status: 401 } }, second succeeds
    const axios401 = Object.assign(new Error('unauthorized'), {
      response: { status: 401 },
    });
    axiosGet
      .mockRejectedValueOnce(axios401 as any)
      .mockResolvedValueOnce({ data: { ok: true, me: 'again' } });

    const me = await service.me();
    expect(me).toEqual({ ok: true, me: 'again' });

    // token fetched twice (old then new)
    expect(axiosPost).toHaveBeenCalledTimes(2);

    // check Authorization headers on both attempts
    const authHeaders = axiosGet.mock.calls.map(
      ([, cfg]) => cfg.headers.Authorization,
    );
    expect(authHeaders).toEqual(['Bearer OLD', 'Bearer NEW']);
  });

  it('listRegistrations includes Person when includePerson=true (default)', async () => {
    await build({
      UC_API_DOMAIN: 'api.example.com',
      UC_CLIENT_ID: 'id',
      UC_CLIENT_SECRET: 'secret',
    });

    axiosPost.mockResolvedValueOnce({
      data: { access_token: 'T', expires_in: 3600 },
    });
    axiosGet.mockResolvedValueOnce({ data: { result: [{ id: 1 }] } });

    const res = await service.listRegistrations(156458 /*eventId*/);
    expect(res).toEqual({ result: [{ id: 1 }] });

    // call shape
    expect(axiosGet).toHaveBeenCalledWith(
      '/api/registrations',
      expect.objectContaining({
        headers: { Authorization: 'Bearer T' },
        params: { event_id: 156458, fields: 'Person' },
      }),
    );
  });

  it('listRegistrations omits Person when includePerson=false', async () => {
    await build({
      UC_API_DOMAIN: 'api.example.com',
      UC_CLIENT_ID: 'id',
      UC_CLIENT_SECRET: 'secret',
    });

    axiosPost.mockResolvedValueOnce({
      data: { access_token: 'T', expires_in: 3600 },
    });
    axiosGet.mockResolvedValueOnce({ data: { result: [] } });

    await service.listRegistrations(123, false);

    expect(axiosGet).toHaveBeenCalledWith(
      '/api/registrations',
      expect.objectContaining({
        headers: { Authorization: 'Bearer T' },
        params: { event_id: 123 }, // no fields: 'Person'
      }),
    );
  });

  it('listTeams and listGames forward mapped query params', async () => {
    await build({
      UC_API_DOMAIN: 'api.example.com',
      UC_CLIENT_ID: 'id',
      UC_CLIENT_SECRET: 'secret',
    });

    axiosPost.mockResolvedValueOnce({
      data: { access_token: 'T', expires_in: 3600 },
    });
    axiosGet
      .mockResolvedValueOnce({ data: { result: [{ id: 10 }] } }) // teams
      .mockResolvedValueOnce({ data: { result: [{ id: 99 }] } }); // games

    const teams = await service.listTeams({ event_id: 42, page: 2 });
    const games = await service.listGames({ event_id: 42, per_page: 5 });

    expect(teams).toEqual({ result: [{ id: 10 }] });
    expect(games).toEqual({ result: [{ id: 99 }] });

    // Teams call
    expect(axiosGet.mock.calls[0][0]).toBe('/api/teams');
    expect(axiosGet.mock.calls[0][1].params).toEqual(
      expect.objectContaining({ __teams: true, event_id: 42, page: 2 }),
    );

    // Games call
    expect(axiosGet.mock.calls[1][0]).toBe('/api/games');
    expect(axiosGet.mock.calls[1][1].params).toEqual(
      expect.objectContaining({ __games: true, event_id: 42, per_page: 5 }),
    );
  });

  it('throws if client id/secret are missing when fetching a token', async () => {
    await build({
      UC_API_DOMAIN: 'api.example.com',
      // UC_CLIENT_ID missing
      UC_CLIENT_SECRET: 'secret',
    });

    await expect(service.me()).rejects.toThrow(
      'UC_CLIENT_ID/UC_CLIENT_SECRET are not set',
    );
    expect(axiosPost).not.toHaveBeenCalled();
  });
});
