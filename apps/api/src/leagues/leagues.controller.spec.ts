/* eslint-disable @typescript-eslint/no-unsafe-return */
// src/leagues/leagues.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { LeaguesController } from './leagues.controller';
import { FixturesService } from '../fixtures/fixtures.service';

describe('LeaguesController', () => {
  let controller: LeaguesController;

  const fixturesMock = {
    getLeagues: jest.fn(),
    getLeagueById: jest.fn(),
    getTeams: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaguesController],
      providers: [{ provide: FixturesService, useValue: fixturesMock }],
    }).compile();

    controller = module.get<LeaguesController>(LeaguesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('latest()', () => {
    it('returns first league when available', () => {
      fixturesMock.getLeagues.mockReturnValueOnce([
        { id: 'L1', name: 'Alpha' },
        { id: 'L2', name: 'Beta' },
      ]);

      const out = controller.latest();
      expect(out).toEqual({ id: 'L1', name: 'Alpha' });
      expect(fixturesMock.getLeagues).toHaveBeenCalledTimes(1);
    });

    it('returns null when no leagues', () => {
      fixturesMock.getLeagues.mockReturnValueOnce([]);
      const out = controller.latest();
      expect(out).toBeNull();
    });
  });

  describe('recent(limit)', () => {
    it('defaults to first 10 when limit not provided', () => {
      const rows = Array.from({ length: 15 }, (_, i) => ({ id: `L${i + 1}` }));
      fixturesMock.getLeagues.mockReturnValueOnce(rows);

      const out = controller.recent(undefined);
      expect(out).toHaveLength(10);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(out.map((r: any) => r.id)).toEqual(
        rows.slice(0, 10).map((r) => r.id),
      );
    });

    it('applies numeric limit when provided as string', () => {
      const rows = [{ id: 'L1' }, { id: 'L2' }, { id: 'L3' }, { id: 'L4' }];
      fixturesMock.getLeagues.mockReturnValueOnce(rows);

      const out = controller.recent('2');
      expect(out).toEqual([{ id: 'L1' }, { id: 'L2' }]);
    });
  });

  describe('byId(id)', () => {
    it('returns the league when found', () => {
      fixturesMock.getLeagueById.mockReturnValueOnce({
        id: 'L2',
        name: 'Beta',
      });
      const out = controller.byId('L2');
      expect(out).toEqual({ id: 'L2', name: 'Beta' });
      expect(fixturesMock.getLeagueById).toHaveBeenCalledWith('L2');
    });

    it('returns null when not found', () => {
      fixturesMock.getLeagueById.mockReturnValueOnce(undefined);
      const out = controller.byId('nope');
      expect(out).toBeNull();
    });
  });

  describe('byIdTeams(id, pods?)', () => {
    it('passes kind=undefined when pods param is not "true"', () => {
      fixturesMock.getTeams.mockReturnValueOnce([{ id: 'T1' }]);

      const out = controller.byIdTeams('L1', undefined);
      expect(out).toEqual([{ id: 'T1' }]);
      expect(fixturesMock.getTeams).toHaveBeenCalledWith('L1', undefined);
    });

    it('passes kind="pod" when pods="true"', () => {
      fixturesMock.getTeams.mockReturnValueOnce([{ id: 'P1' }]);

      const out = controller.byIdTeams('L1', 'true');
      expect(out).toEqual([{ id: 'P1' }]);
      expect(fixturesMock.getTeams).toHaveBeenCalledWith('L1', 'pod');
    });
  });
});
