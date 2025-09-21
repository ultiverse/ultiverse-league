/* eslint-disable @typescript-eslint/no-unsafe-return */
// src/leagues/leagues.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { LeaguesController } from './leagues.controller';
import { FixturesService } from '../fixtures/fixtures.service';
import { LEAGUE_PROVIDER, TEAMS_PROVIDER } from '../integrations/ports';

describe('LeaguesController', () => {
  let controller: LeaguesController;

  const fixturesMock = {
    getLeagues: jest.fn(),
    getLeagueById: jest.fn(),
    getTeams: jest.fn(),
  };

  const leagueProviderMock = {
    listRecent: jest.fn(),
    getLeagueById: jest.fn(),
  };

  const teamsProviderMock = {
    listTeams: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaguesController],
      providers: [
        { provide: FixturesService, useValue: fixturesMock },
        { provide: LEAGUE_PROVIDER, useValue: leagueProviderMock },
        { provide: TEAMS_PROVIDER, useValue: teamsProviderMock },
      ],
    }).compile();

    controller = module.get<LeaguesController>(LeaguesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('latest()', () => {
    it('returns first league when available', async () => {
      fixturesMock.getLeagues.mockReturnValueOnce([
        { id: 'L1', name: 'Alpha' },
        { id: 'L2', name: 'Beta' },
      ]);

      const out = await controller.latest();
      expect(out).toEqual({ id: 'L1', name: 'Alpha' });
      expect(fixturesMock.getLeagues).toHaveBeenCalledTimes(1);
    });

    it('returns null when no leagues', async () => {
      fixturesMock.getLeagues.mockReturnValueOnce([]);
      const out = await controller.latest();
      expect(out).toBeNull();
    });

    it('returns first league from external integration', async () => {
      leagueProviderMock.listRecent.mockResolvedValueOnce([
        { id: 'EXT1', name: 'External League' },
      ]);

      const out = await controller.latest('external');
      expect(out).toEqual({ id: 'EXT1', name: 'External League' });
      expect(leagueProviderMock.listRecent).toHaveBeenCalledTimes(1);
    });
  });

  describe('recent(limit)', () => {
    it('defaults to first 10 when limit not provided', async () => {
      const rows = Array.from({ length: 15 }, (_, i) => ({ id: `L${i + 1}` }));
      fixturesMock.getLeagues.mockReturnValueOnce(rows);

      const out = await controller.recent(undefined);
      expect(out).toHaveLength(10);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(out.map((r: any) => r.id)).toEqual(
        rows.slice(0, 10).map((r) => r.id),
      );
    });

    it('applies numeric limit when provided as string', async () => {
      const rows = [{ id: 'L1' }, { id: 'L2' }, { id: 'L3' }, { id: 'L4' }];
      fixturesMock.getLeagues.mockReturnValueOnce(rows);

      const out = await controller.recent('2');
      expect(out).toEqual([{ id: 'L1' }, { id: 'L2' }]);
    });

    it('returns leagues from external integration when specified', async () => {
      const extLeagues = [{ id: 'EXT1' }, { id: 'EXT2' }];
      leagueProviderMock.listRecent.mockResolvedValueOnce(extLeagues);

      const out = await controller.recent('10', 'external');
      expect(out).toEqual(extLeagues);
      expect(leagueProviderMock.listRecent).toHaveBeenCalledTimes(1);
    });
  });

  describe('byId(id)', () => {
    it('returns the league when found', async () => {
      fixturesMock.getLeagueById.mockReturnValueOnce({
        id: 'L2',
        name: 'Beta',
      });
      const out = await controller.byId('L2');
      expect(out).toEqual({ id: 'L2', name: 'Beta' });
      expect(fixturesMock.getLeagueById).toHaveBeenCalledWith('L2');
    });

    it('returns null when not found', async () => {
      fixturesMock.getLeagueById.mockReturnValueOnce(undefined);
      const out = await controller.byId('nope');
      expect(out).toBeNull();
    });

    it('returns league from external integration when specified', async () => {
      const extLeague = { id: 'EXT1', name: 'External League' };
      leagueProviderMock.getLeagueById.mockResolvedValueOnce(extLeague);

      const out = await controller.byId('EXT1', 'external');
      expect(out).toEqual(extLeague);
      expect(leagueProviderMock.getLeagueById).toHaveBeenCalledWith('EXT1');
    });
  });

  describe('byIdTeams(id, pods?)', () => {
    it('passes kind=undefined when pods param is not "true"', async () => {
      fixturesMock.getTeams.mockReturnValueOnce([{ id: 'T1' }]);

      const out = await controller.byIdTeams('L1', undefined);
      expect(out).toEqual([{ id: 'T1' }]);
      expect(fixturesMock.getTeams).toHaveBeenCalledWith('L1', undefined);
    });

    it('passes kind="pod" when pods="true"', async () => {
      fixturesMock.getTeams.mockReturnValueOnce([{ id: 'P1' }]);

      const out = await controller.byIdTeams('L1', 'true');
      expect(out).toEqual([{ id: 'P1' }]);
      expect(fixturesMock.getTeams).toHaveBeenCalledWith('L1', 'pod');
    });

    it('returns teams from external integration when specified', async () => {
      const extTeams = [{ id: 'EXTT1' }, { id: 'EXTT2' }];
      teamsProviderMock.listTeams.mockResolvedValueOnce(extTeams);

      const out = await controller.byIdTeams('EXT1', undefined, 'external');
      expect(out).toEqual(extTeams);
      expect(teamsProviderMock.listTeams).toHaveBeenCalledWith('EXT1');
    });
  });
});
