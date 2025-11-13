import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GameDiscoveryService } from './game-discovery.service';
import {
  Game,
  ExternalGameSource,
  League,
  ExternalLeagueSource,
  Team,
  ExternalTeamSource,
} from '../database/entities';
import { UCGamesService } from './uc/uc.games/uc.games.service';

describe('GameDiscoveryService', () => {
  let service: GameDiscoveryService;

  const mockGameRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockExternalGameSourceRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockLeagueRepo = {
    findOne: jest.fn(),
  };

  const mockExternalLeagueSourceRepo = {
    findOne: jest.fn(),
  };

  const mockTeamRepo = {
    findOne: jest.fn(),
  };

  const mockExternalTeamSourceRepo = {
    findOne: jest.fn(),
  };

  const mockUCGamesService = {
    list: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameDiscoveryService,
        {
          provide: getRepositoryToken(Game),
          useValue: mockGameRepo,
        },
        {
          provide: getRepositoryToken(ExternalGameSource),
          useValue: mockExternalGameSourceRepo,
        },
        {
          provide: getRepositoryToken(League),
          useValue: mockLeagueRepo,
        },
        {
          provide: getRepositoryToken(ExternalLeagueSource),
          useValue: mockExternalLeagueSourceRepo,
        },
        {
          provide: getRepositoryToken(Team),
          useValue: mockTeamRepo,
        },
        {
          provide: getRepositoryToken(ExternalTeamSource),
          useValue: mockExternalTeamSourceRepo,
        },
        {
          provide: UCGamesService,
          useValue: mockUCGamesService,
        },
      ],
    }).compile();

    service = module.get<GameDiscoveryService>(GameDiscoveryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('discoverGamesForLeague', () => {
    it('should discover games from UC and create Game records', async () => {
      const leagueId = 'league-123';
      const provider = 'ultimate_central';

      const mockLeague = {
        id: leagueId,
        name: 'Test League',
        externalSources: [{ provider, externalId: '999' }],
      };

      const mockGames = {
        result: [
          {
            id: 501,
            event_id: 999,
            home_team_id: 101,
            away_team_id: 102,
            date: '2025-06-15',
            time: '18:00:00',
            status: 'scheduled',
            field: 'Field 1',
          },
          {
            id: 502,
            event_id: 999,
            home_team_id: 103,
            away_team_id: 104,
            date: '2025-06-15',
            time: '19:30:00',
            status: 'scheduled',
            field: 'Field 2',
          },
        ],
      };

      mockLeagueRepo.findOne.mockResolvedValue(mockLeague as any);
      mockUCGamesService.list.mockResolvedValue(mockGames as any);
      mockExternalTeamSourceRepo.findOne
        .mockResolvedValueOnce({ teamId: 'team-1' } as any)
        .mockResolvedValueOnce({ teamId: 'team-2' } as any)
        .mockResolvedValueOnce({ teamId: 'team-3' } as any)
        .mockResolvedValueOnce({ teamId: 'team-4' } as any);
      mockExternalGameSourceRepo.findOne.mockResolvedValue(null);
      mockGameRepo.create.mockImplementation((data: any) => data);
      mockGameRepo.save.mockImplementation((game) =>
        Promise.resolve({ ...game, id: 'game-' + Math.random() }),
      );
      mockExternalGameSourceRepo.create.mockImplementation((data: any) => data);
      mockExternalGameSourceRepo.save.mockResolvedValue({} as any);

      const result = await service.discoverGamesForLeague(leagueId, provider);

      expect(result).toHaveLength(2);
      expect(mockUCGamesService.list).toHaveBeenCalledWith({
        event_id: 999,
        per_page: 1000,
      });
      expect(mockGameRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should update existing games when found', async () => {
      const leagueId = 'league-123';
      const provider = 'ultimate_central';

      const existingGame = {
        id: 'existing-game-id',
        leagueId,
        homeTeamId: 'old-home',
        awayTeamId: 'old-away',
        startTime: new Date('2025-06-15T18:00:00'),
        isEditable: false,
      };

      const existingSource = {
        source: provider,
        externalId: '501',
        game: existingGame,
      };

      const mockLeague = {
        id: leagueId,
        externalSources: [{ provider, externalId: '999' }],
      };

      const mockGames = {
        result: [
          {
            id: 501,
            home_team_id: 101,
            away_team_id: 102,
            date: '2025-06-16',
            time: '19:00:00',
            status: 'scheduled',
          },
        ],
      };

      mockLeagueRepo.findOne.mockResolvedValue(mockLeague as any);
      mockUCGamesService.list.mockResolvedValue(mockGames as any);
      mockExternalTeamSourceRepo.findOne
        .mockResolvedValueOnce({ teamId: 'team-1' } as any)
        .mockResolvedValueOnce({ teamId: 'team-2' } as any);
      mockExternalGameSourceRepo.findOne.mockResolvedValue(
        existingSource as any,
      );
      mockExternalGameSourceRepo.save.mockResolvedValue(existingSource as any);
      mockGameRepo.save.mockResolvedValue(existingGame as any);

      const result = await service.discoverGamesForLeague(leagueId, provider);

      expect(result).toHaveLength(1);
      expect(mockGameRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          homeTeamId: 'team-1',
          awayTeamId: 'team-2',
        }),
      );
    });

    it('should skip games without date/time', async () => {
      const leagueId = 'league-123';
      const provider = 'ultimate_central';

      const mockLeague = {
        id: leagueId,
        externalSources: [{ provider, externalId: '999' }],
      };

      const mockGames = {
        result: [
          {
            id: 501,
            home_team_id: 101,
            away_team_id: 102,
            // No date/time
            status: 'teams_not_set',
          },
        ],
      };

      mockLeagueRepo.findOne.mockResolvedValue(mockLeague as any);
      mockUCGamesService.list.mockResolvedValue(mockGames as any);

      const result = await service.discoverGamesForLeague(leagueId, provider);

      expect(result).toHaveLength(0);
      expect(mockGameRepo.save).not.toHaveBeenCalled();
    });

    it('should handle games with TBD teams', async () => {
      const leagueId = 'league-123';
      const provider = 'ultimate_central';

      const mockLeague = {
        id: leagueId,
        externalSources: [{ provider, externalId: '999' }],
      };

      const mockGames = {
        result: [
          {
            id: 501,
            // No team IDs - TBD
            date: '2025-06-15',
            time: '18:00:00',
            status: 'teams_not_set',
          },
        ],
      };

      mockLeagueRepo.findOne.mockResolvedValue(mockLeague as any);
      mockUCGamesService.list.mockResolvedValue(mockGames as any);
      mockExternalGameSourceRepo.findOne.mockResolvedValue(null);
      mockGameRepo.create.mockImplementation((data: any) => data);
      mockGameRepo.save.mockImplementation((game) =>
        Promise.resolve({ ...game, id: 'game-123' }),
      );
      mockExternalGameSourceRepo.create.mockImplementation((data: any) => data);
      mockExternalGameSourceRepo.save.mockResolvedValue({} as any);

      const result = await service.discoverGamesForLeague(leagueId, provider);

      expect(result).toHaveLength(1);
      expect(mockGameRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          homeTeamId: undefined,
          awayTeamId: undefined,
        }),
      );
    });

    it('should map UC game status to canonical status', async () => {
      const leagueId = 'league-123';
      const provider = 'ultimate_central';

      const mockLeague = {
        id: leagueId,
        externalSources: [{ provider, externalId: '999' }],
      };

      const mockGames = {
        result: [
          {
            id: 501,
            date: '2025-06-15',
            time: '18:00:00',
            status: 'has_outcome',
          },
          {
            id: 502,
            date: '2025-06-15',
            time: '19:00:00',
            status: 'in_progress',
          },
        ],
      };

      mockLeagueRepo.findOne.mockResolvedValue(mockLeague as any);
      mockUCGamesService.list.mockResolvedValue(mockGames as any);
      mockExternalGameSourceRepo.findOne.mockResolvedValue(null);
      mockGameRepo.create.mockImplementation((data: any) => data);
      mockGameRepo.save.mockImplementation((game) =>
        Promise.resolve({ ...game, id: 'game-' + Math.random() }),
      );
      mockExternalGameSourceRepo.create.mockImplementation((data: any) => data);
      mockExternalGameSourceRepo.save.mockResolvedValue({} as any);

      const result = await service.discoverGamesForLeague(leagueId, provider);

      expect(result).toHaveLength(2);
      const savedCalls = mockGameRepo.save.mock.calls;
      expect(savedCalls[0][0]).toMatchObject({ status: 'completed' });
      expect(savedCalls[1][0]).toMatchObject({ status: 'in_progress' });
    });
  });

  describe('areGamesStale', () => {
    it('should return true if no games found', async () => {
      mockGameRepo.find.mockResolvedValue([]);

      const result = await service.areGamesStale('league-123');

      expect(result).toBe(true);
    });

    it('should return true if games are older than 7 days', async () => {
      const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago

      const mockGames = [
        {
          externalSources: [
            {
              lastSyncedAt: oldDate,
            },
          ],
        },
      ];

      mockGameRepo.find.mockResolvedValue(mockGames as any);

      const result = await service.areGamesStale('league-123');

      expect(result).toBe(true);
    });

    it('should return false if games are fresh', async () => {
      const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

      const mockGames = [
        {
          externalSources: [
            {
              lastSyncedAt: recentDate,
            },
          ],
        },
      ];

      mockGameRepo.find.mockResolvedValue(mockGames as any);

      const result = await service.areGamesStale('league-123');

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw error if league not found', async () => {
      mockLeagueRepo.findOne.mockResolvedValue(null);

      await expect(
        service.discoverGamesForLeague('nonexistent', 'ultimate_central'),
      ).rejects.toThrow('League nonexistent not found');
    });

    it('should throw error if league has no external source', async () => {
      const mockLeague = {
        id: 'league-123',
        externalSources: [],
      };

      mockLeagueRepo.findOne.mockResolvedValue(mockLeague as any);

      await expect(
        service.discoverGamesForLeague('league-123', 'ultimate_central'),
      ).rejects.toThrow(
        'No external source found for league league-123 with provider ultimate_central',
      );
    });

    it('should throw error for unsupported provider', async () => {
      const mockLeague = {
        id: 'league-123',
        externalSources: [{ provider: 'zuluru', externalId: '999' }],
      };

      mockLeagueRepo.findOne.mockResolvedValue(mockLeague as any);

      await expect(
        service.discoverGamesForLeague('league-123', 'zuluru'),
      ).rejects.toThrow('Provider zuluru not supported for game discovery');
    });

    it('should continue processing other games if one fails', async () => {
      const leagueId = 'league-123';
      const provider = 'ultimate_central';

      const mockLeague = {
        id: leagueId,
        externalSources: [{ provider, externalId: '999' }],
      };

      const mockGames = {
        result: [
          {
            id: 501,
            home_team_id: 101,
            away_team_id: 102,
            date: '2025-06-15',
            time: '18:00:00',
            status: 'scheduled',
          },
          {
            id: 502,
            date: '2025-06-15',
            time: '19:00:00',
            // This one will fail team lookup
          },
        ],
      };

      mockLeagueRepo.findOne.mockResolvedValue(mockLeague as any);
      mockUCGamesService.list.mockResolvedValue(mockGames as any);
      mockExternalTeamSourceRepo.findOne
        .mockResolvedValueOnce({ teamId: 'team-1' } as any)
        .mockResolvedValueOnce({ teamId: 'team-2' } as any);
      mockExternalGameSourceRepo.findOne.mockResolvedValue(null);
      mockGameRepo.create.mockImplementation((data: any) => data);
      mockGameRepo.save.mockImplementation((game) =>
        Promise.resolve({ ...game, id: 'game-' + Math.random() }),
      );
      mockExternalGameSourceRepo.create.mockImplementation((data: any) => data);
      mockExternalGameSourceRepo.save.mockResolvedValue({} as any);

      const result = await service.discoverGamesForLeague(leagueId, provider);

      // Should still process both games
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('date/time parsing', () => {
    it('should parse UC date and time correctly', async () => {
      const leagueId = 'league-123';
      const provider = 'ultimate_central';

      const mockLeague = {
        id: leagueId,
        externalSources: [{ provider, externalId: '999' }],
      };

      const mockGames = {
        result: [
          {
            id: 501,
            date: '2025-12-25',
            time: '14:30:00',
            status: 'scheduled',
          },
        ],
      };

      mockLeagueRepo.findOne.mockResolvedValue(mockLeague as any);
      mockUCGamesService.list.mockResolvedValue(mockGames as any);
      mockExternalGameSourceRepo.findOne.mockResolvedValue(null);
      mockGameRepo.create.mockImplementation((data: any) => data);
      mockGameRepo.save.mockImplementation((game) =>
        Promise.resolve({ ...game, id: 'game-123' }),
      );
      mockExternalGameSourceRepo.create.mockImplementation((data: any) => data);
      mockExternalGameSourceRepo.save.mockResolvedValue({} as any);

      await service.discoverGamesForLeague(leagueId, provider);

      expect(mockGameRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: new Date('2025-12-25T14:30:00'),
        }),
      );
    });

    it('should handle date without time', async () => {
      const leagueId = 'league-123';
      const provider = 'ultimate_central';

      const mockLeague = {
        id: leagueId,
        externalSources: [{ provider, externalId: '999' }],
      };

      const mockGames = {
        result: [
          {
            id: 501,
            date: '2025-06-15',
            // No time
            status: 'scheduled',
          },
        ],
      };

      mockLeagueRepo.findOne.mockResolvedValue(mockLeague as any);
      mockUCGamesService.list.mockResolvedValue(mockGames as any);
      mockExternalGameSourceRepo.findOne.mockResolvedValue(null);
      mockGameRepo.create.mockImplementation((data: any) => data);
      mockGameRepo.save.mockResolvedValue({ id: 'game-123' } as any);
      mockExternalGameSourceRepo.create.mockImplementation((data: any) => data);
      mockExternalGameSourceRepo.save.mockResolvedValue({} as any);

      await service.discoverGamesForLeague(leagueId, provider);

      expect(mockGameRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: new Date('2025-06-15T00:00:00'),
        }),
      );
    });
  });
});
