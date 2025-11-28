/* eslint-disable @typescript-eslint/no-unsafe-return */
// src/leagues/leagues.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { LeaguesController } from './leagues.controller';
import { FixturesService } from '../fixtures/fixtures.service';
import {
  LEAGUE_PROVIDER,
  TEAMS_PROVIDER,
  FIELDS_PROVIDER,
} from '../integrations/ports';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  League,
  ExternalLeagueSource,
  IntegrationConnection,
  Team,
  Account,
} from '../database/entities';
import { LeagueDiscoveryService } from '../integrations/league-discovery.service';
import { ImportService } from '../imports/import.service';

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

  const fieldsProviderMock = {
    listFields: jest.fn(),
  };

  const leagueDiscoveryMock = {
    discoverLeagues: jest.fn(),
    areLeaguesStale: jest.fn(),
  };

  const importServiceMock = {
    importLeague: jest.fn(),
  };

  const leagueRepoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const externalSourceRepoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const integrationRepoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const teamRepoMock = {
    find: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawAndEntities: jest.fn().mockResolvedValue({
        entities: [],
        raw: [],
      }),
    })),
  };

  const accountRepoMock = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaguesController],
      providers: [
        { provide: FixturesService, useValue: fixturesMock },
        { provide: LEAGUE_PROVIDER, useValue: leagueProviderMock },
        { provide: TEAMS_PROVIDER, useValue: teamsProviderMock },
        { provide: FIELDS_PROVIDER, useValue: fieldsProviderMock },
        { provide: LeagueDiscoveryService, useValue: leagueDiscoveryMock },
        { provide: ImportService, useValue: importServiceMock },
        { provide: getRepositoryToken(League), useValue: leagueRepoMock },
        {
          provide: getRepositoryToken(ExternalLeagueSource),
          useValue: externalSourceRepoMock,
        },
        {
          provide: getRepositoryToken(IntegrationConnection),
          useValue: integrationRepoMock,
        },
        { provide: getRepositoryToken(Team), useValue: teamRepoMock },
        { provide: getRepositoryToken(Account), useValue: accountRepoMock },
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
      // Mock the query builder to return a team with player count
      teamRepoMock.createQueryBuilder.mockReturnValueOnce({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [{ id: 'T1', name: 'Team 1', colour: '#000', altColour: '#fff' }],
          raw: [{ playerCount: '5' }],
        }),
      });

      const out = await controller.byIdTeams('L1', undefined);
      expect(out).toEqual([{
        id: 'T1',
        name: 'Team 1',
        colour: '#000',
        altColour: '#fff',
        location: undefined,
        seasonStart: undefined,
        seasonEnd: undefined,
        playerCount: 5,
      }]);
    });

    it('passes kind="pod" when pods="true"', async () => {
      teamRepoMock.createQueryBuilder.mockReturnValueOnce({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [{ id: 'P1', name: 'Pod 1', colour: '#000', altColour: '#fff' }],
          raw: [{ playerCount: '3' }],
        }),
      });

      const out = await controller.byIdTeams('L1', 'true');
      expect(out).toEqual([{
        id: 'P1',
        name: 'Pod 1',
        colour: '#000',
        altColour: '#fff',
        location: undefined,
        seasonStart: undefined,
        seasonEnd: undefined,
        playerCount: 3,
      }]);
    });

    it('returns teams from external integration when specified', async () => {
      teamRepoMock.createQueryBuilder.mockReturnValueOnce({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [],
          raw: [],
        }),
      });
      const extTeams = [{ id: 'EXTT1' }, { id: 'EXTT2' }];
      teamsProviderMock.listTeams.mockResolvedValueOnce(extTeams);

      const out = await controller.byIdTeams('EXT1', undefined, 'external');
      expect(out).toEqual(extTeams);
      expect(teamsProviderMock.listTeams).toHaveBeenCalledWith('EXT1');
    });
  });
});
