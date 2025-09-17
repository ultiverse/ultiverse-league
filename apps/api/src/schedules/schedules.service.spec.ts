import { Test, TestingModule } from '@nestjs/testing';
import { SchedulesService } from './schedules.service';
import { PodEngineAdapter } from './pod-engine/adapter.service';
import type { PodEngineSchedule } from './pod-engine/pod-engine.types';
import { ITeamsProvider, TEAMS_PROVIDER } from 'src/integrations/ports';

class EngineMock {
  generate = jest.fn<PodEngineSchedule, any[]>();
  assignTimesAndFields = jest.fn<PodEngineSchedule, any[]>();
}

describe('SchedulesService', () => {
  let service: SchedulesService;
  let engineMock: EngineMock;
  const teamsProviderMock: jest.Mocked<ITeamsProvider> = {
    listTeams: jest.fn(),
  };

  beforeEach(async () => {
    engineMock = new EngineMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        { provide: PodEngineAdapter, useValue: engineMock },
        { provide: TEAMS_PROVIDER, useValue: teamsProviderMock },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('generatePodsView maps engine output -> ScheduleView with IDs, time, field, duration', () => {
    const schedule: PodEngineSchedule = {
      rounds: [
        {
          roundNumber: 1,
          matches: [
            {
              id: 'r1_m1',
              round: 1,
              team1: { pod1: { id: 'A' }, pod2: { id: 'B' } },
              team2: { pod1: { id: 'C' }, pod2: { id: 'D' } },
              scheduledTime: '2025-01-01T23:00:00.000Z',
              field: 'Field A',
              duration: 60,
            },
            {
              id: 'r1_m2',
              round: 1,
              team1: { pod1: { id: 'E' }, pod2: { id: 'F' } },
              team2: { pod1: { id: 'G' }, pod2: { id: 'H' } },
              scheduledTime: '2025-01-01T23:00:00.000Z',
              field: 'Field B',
              duration: 60,
            },
          ],
        },
      ],
      statistics: {},
    };

    engineMock.generate.mockReturnValue(schedule);
    engineMock.assignTimesAndFields.mockReturnValue(schedule);

    const view = service.generatePodsView(
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      {
        rounds: 1,
        names: { A: 'Alpha' },
        leagueId: 'fx:league:1',
        fields: ['Field A', 'Field B'],
        durationMins: 60,
      },
    );

    expect(view.leagueId).toBe('fx:league:1');
    expect(view.rounds).toHaveLength(1);

    const r1 = view.rounds[0];
    expect(r1.round).toBe(1);
    expect(r1.games).toHaveLength(2);

    expect(r1.games[0].gameId).toBe('R1G1');
    expect(r1.games[1].gameId).toBe('R1G2');

    expect(r1.games[0].home).toEqual({ pods: ['A', 'B'] });
    expect(r1.games[0].away).toEqual({ pods: ['C', 'D'] });

    expect(r1.games[0].start).toBe('2025-01-01T23:00:00.000Z');
    expect(r1.games[0].field).toBe('Field A');
    expect(r1.games[0].durationMins).toBe(60);

    expect(r1.games[1].home).toEqual({ pods: ['E', 'F'] });
    expect(r1.games[1].away).toEqual({ pods: ['G', 'H'] });
    expect(r1.games[1].field).toBe('Field B');

    // No unbound-method here because these are arrow methods on the instance
    expect(engineMock.generate).toHaveBeenCalledTimes(1);
    expect(engineMock.assignTimesAndFields).toHaveBeenCalledTimes(1);
  });

  it('getLeagueSchedule (fixtures) synthesizes pods and delegates to engine', async () => {
    const schedule: PodEngineSchedule = {
      rounds: [{ roundNumber: 1, matches: [] }],
      statistics: {},
    };
    engineMock.generate.mockReturnValue(schedule);
    engineMock.assignTimesAndFields.mockReturnValue(schedule);

    const view = await service.getLeagueSchedule('fx:league:1', 'fixtures', 1);

    expect(view.leagueId).toBe('fx:league:1');
    expect(view.rounds).toHaveLength(1);
    expect(engineMock.generate).toHaveBeenCalled();
    expect(engineMock.assignTimesAndFields).toHaveBeenCalled();
  });

  it('getLeagueSchedule (uc) uses teams as pods with uc: prefixes and event leagueId', async () => {
    teamsProviderMock.listTeams.mockResolvedValue([
      { id: 't1', name: 'Team 1' },
      { id: 't2', name: 'Team 2' },
      { id: 't3', name: 'Team 3' },
      { id: 't4', name: 'Team 4' },
    ]);

    const schedule: PodEngineSchedule = {
      rounds: [{ roundNumber: 1, matches: [] }],
      statistics: {},
    };
    engineMock.generate.mockReturnValue(schedule);
    engineMock.assignTimesAndFields.mockReturnValue(schedule);

    const view = await service.getLeagueSchedule('ignored', 'uc', 1, '169113');

    expect(view.leagueId).toBe('uc:event:169113');
    expect(engineMock.generate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'uc:team:t1' }),
        expect.objectContaining({ id: 'uc:team:t2' }),
        expect.objectContaining({ id: 'uc:team:t3' }),
        expect.objectContaining({ id: 'uc:team:t4' }),
      ]),
      expect.any(Object),
    );
  });
});
