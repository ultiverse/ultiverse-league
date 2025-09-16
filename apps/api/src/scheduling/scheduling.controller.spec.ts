import { Test, TestingModule } from '@nestjs/testing';
import { SchedulingController } from './scheduling.controller';
import { PodSchedulerService } from './pod-scheduler.service';
import { FixturesService } from '../fixtures/fixtures.service';

// ✅ Inject the provider-agnostic Teams port
import { TEAMS_PROVIDER } from '../integrations/ports';

let allocateMock: jest.Mock;

// Mock FieldAllocator so the controller can new it, but we control allocate()
jest.mock('./field-allocator.util', () => {
  return {
    __esModule: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    FieldAllocator: jest.fn().mockImplementation((_fixtures: any) => ({
      allocate: allocateMock,
    })),
  };
});

describe('SchedulingController', () => {
  let controller: SchedulingController;

  // collaborators
  const schedulerMock = {
    build: jest.fn(),
  };
  const fixturesMock = {
    getTeams: jest.fn(),
  };

  // 👇 Provider-agnostic Teams port mock (backs UC today via UCAdapter)
  const teamsProviderMock = {
    listTeams: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    allocateMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulingController],
      providers: [
        { provide: PodSchedulerService, useValue: schedulerMock },
        { provide: FixturesService, useValue: fixturesMock },
        { provide: TEAMS_PROVIDER, useValue: teamsProviderMock }, // 👈 inject token
      ],
    }).compile();

    controller = module.get<SchedulingController>(SchedulingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /schedule (buildGeneric)', () => {
    it('builds a schedule and maps to view with default pairingMode', () => {
      // schedule output from service
      schedulerMock.build.mockReturnValueOnce({
        rounds: [{ round: 1, blocks: [{ a: 'A', b: 'B', c: 'C', d: 'D' }] }],
      });

      // no leagueId => fixtures.getTeams(undefined, 'pod') returns empty (names fall back to IDs)
      fixturesMock.getTeams.mockReturnValueOnce([]);

      // allocator returns slots for 1 game
      const slot = {
        start: '2025-06-01T22:00:00Z',
        durationMins: 60,
        field: 'Field 1',
      };
      allocateMock.mockReturnValueOnce([slot]);

      const dto = {
        pods: ['A', 'B', 'C', 'D'],
        rounds: 1,
        // pairingMode omitted -> default 'each-vs-both'
      };

      const out = controller.buildGeneric(dto as any);
      expect(out.leagueId).toBeUndefined();
      expect(out.rounds).toHaveLength(1);
      expect(out.rounds[0].round).toBe(1);
      expect(out.rounds[0].games).toEqual([
        {
          gameId: 'R1G1',
          start: slot.start,
          durationMins: slot.durationMins,
          field: slot.field,
          home: { pods: ['A', 'B'], teamName: 'A + B' },
          away: { pods: ['C', 'D'], teamName: 'C + D' },
          meta: {},
        },
      ]);

      // scheduler called with default pairingMode
      expect(schedulerMock.build).toHaveBeenCalledWith({
        pods: ['A', 'B', 'C', 'D'],
        rounds: 1,
        recencyWindow: undefined,
        skill: undefined,
        history: undefined,
        pairingMode: 'each-vs-both',
      });

      // allocator called with expected args
      expect(allocateMock).toHaveBeenCalledWith(1, {
        leagueId: undefined,
        roundIndex: 0,
        startBaseISO: '2025-06-01T22:00:00Z',
        durationMins: 60,
      });
    });
  });

  describe('POST /schedule/pods (buildPods)', () => {
    it('uses podIds and maps names via fixtures when available', () => {
      schedulerMock.build.mockReturnValueOnce({
        rounds: [
          { round: 1, blocks: [{ a: 'p1', b: 'p2', c: 'p3', d: 'p4' }] },
        ],
      });

      fixturesMock.getTeams.mockReturnValueOnce([
        { id: 'p1', name: 'Alpha' },
        { id: 'p2', name: 'Bravo' },
        { id: 'p3', name: 'Charlie' },
        { id: 'p4', name: 'Delta' },
      ]);

      allocateMock.mockReturnValueOnce([
        { start: 't', durationMins: 60, field: 'F' },
      ]);

      const dto = {
        podIds: ['p1', 'p2', 'p3', 'p4'],
        rounds: 1,
        pairingMode: 'each-vs-both' as const,
      };

      const out = controller.buildPods(dto as any);
      expect(out.rounds[0].games[0].home.teamName).toBe('Alpha + Bravo');
      expect(out.rounds[0].games[0].away.teamName).toBe('Charlie + Delta');

      expect(schedulerMock.build).toHaveBeenCalledWith({
        pods: ['p1', 'p2', 'p3', 'p4'],
        rounds: 1,
        recencyWindow: undefined,
        skill: undefined,
        history: undefined,
        pairingMode: 'each-vs-both',
      });
    });
  });

  describe('POST /schedule/pods/by-league (buildPodsByLeague)', () => {
    it('loads pods from fixtures and includes leagueId in view', () => {
      // Fixtures provides pods for league
      fixturesMock.getTeams.mockImplementation(
        (leagueId: string, type: string) => {
          if (type === 'pod' && leagueId === '169113') {
            return [
              { id: 'p1', name: 'A' },
              { id: 'p2', name: 'B' },
              { id: 'p3', name: 'C' },
              { id: 'p4', name: 'D' },
            ];
          }
          return [];
        },
      );

      schedulerMock.build.mockReturnValueOnce({
        rounds: [
          { round: 1, blocks: [{ a: 'p1', b: 'p2', c: 'p3', d: 'p4' }] },
        ],
      });

      allocateMock.mockReturnValueOnce([
        { start: 't', durationMins: 60, field: 'F' },
      ]);

      const dto = { leagueId: '169113', rounds: 1 };
      const out = controller.buildPodsByLeague(dto as any);

      // leagueId should be echoed on view
      expect(out.leagueId).toBe('169113');
      expect(out.rounds[0].games[0].home.teamName).toBe('A + B');
      expect(out.rounds[0].games[0].away.teamName).toBe('C + D');

      expect(schedulerMock.build).toHaveBeenCalledWith({
        pods: ['p1', 'p2', 'p3', 'p4'],
        rounds: 1,
        recencyWindow: undefined,
        skill: undefined,
        history: undefined,
        pairingMode: 'each-vs-both',
      });

      // allocator called with league context
      expect(allocateMock).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          leagueId: '169113',
          roundIndex: 0,
        }),
      );
    });
  });

  describe('POST /schedule/pods/by-uc-event (buildPodsByUcEvent)', () => {
    it('fetches teams via provider port, maps to pod IDs, and names teams from response', async () => {
      // Port returns TeamSummary[] (provider-agnostic)
      teamsProviderMock.listTeams.mockResolvedValueOnce([
        { id: '10', name: 'UC Red', division: null },
        { id: '20', name: 'UC Blue', division: null },
        { id: '30', name: 'UC Green', division: null },
        { id: '40', name: 'UC Yellow', division: null },
      ]);

      schedulerMock.build.mockReturnValueOnce({
        rounds: [
          {
            round: 1,
            blocks: [
              {
                a: 'uc:team:10',
                b: 'uc:team:20',
                c: 'uc:team:30',
                d: 'uc:team:40',
              },
            ],
          },
        ],
      });

      allocateMock.mockReturnValueOnce([
        { start: 't', durationMins: 60, field: 'F' },
      ]);

      const dto = { eventId: 123, rounds: 1 };
      const out = await controller.buildPodsByUcEvent(dto as any);

      // leagueId is uc:event:<eventId>
      expect(out.leagueId).toBe('uc:event:123');

      // names mapped from TeamSummary[]
      expect(out.rounds[0].games[0].home.teamName).toBe('UC Red + UC Blue');
      expect(out.rounds[0].games[0].away.teamName).toBe('UC Green + UC Yellow');

      // scheduler called with mapped pod IDs
      expect(schedulerMock.build).toHaveBeenCalledWith({
        pods: ['uc:team:10', 'uc:team:20', 'uc:team:30', 'uc:team:40'],
        rounds: 1,
        recencyWindow: undefined,
        skill: undefined,
        history: undefined,
        pairingMode: 'each-vs-both',
      });

      // allocator called with uc league id
      expect(allocateMock).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          leagueId: 'uc:event:123',
          roundIndex: 0,
        }),
      );
    });
  });
});
