import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerDiscoveryService } from './player-discovery.service';
import {
  Player,
  ExternalPlayerSource,
  Membership,
  Team,
  ExternalTeamSource,
} from '../database/entities';
import { UCRegistrationsService } from './uc/uc.registrations/uc.registrations.service';

describe('PlayerDiscoveryService', () => {
  let service: PlayerDiscoveryService;
  let playerRepo: jest.Mocked<Repository<Player>>;
  let externalPlayerSourceRepo: jest.Mocked<Repository<ExternalPlayerSource>>;
  let membershipRepo: jest.Mocked<Repository<Membership>>;
  let teamRepo: jest.Mocked<Repository<Team>>;
  let externalTeamSourceRepo: jest.Mocked<Repository<ExternalTeamSource>>;
  let ucRegistrationsService: jest.Mocked<UCRegistrationsService>;

  const mockPlayerRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockExternalPlayerSourceRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockMembershipRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTeamRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    manager: {
      findOne: jest.fn(),
    },
  };

  const mockExternalTeamSourceRepo = {
    findOne: jest.fn(),
  };

  const mockUCRegistrationsService = {
    list: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerDiscoveryService,
        {
          provide: getRepositoryToken(Player),
          useValue: mockPlayerRepo,
        },
        {
          provide: getRepositoryToken(ExternalPlayerSource),
          useValue: mockExternalPlayerSourceRepo,
        },
        {
          provide: getRepositoryToken(Membership),
          useValue: mockMembershipRepo,
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
          provide: UCRegistrationsService,
          useValue: mockUCRegistrationsService,
        },
      ],
    }).compile();

    service = module.get<PlayerDiscoveryService>(PlayerDiscoveryService);
    playerRepo = module.get(getRepositoryToken(Player));
    externalPlayerSourceRepo = module.get(
      getRepositoryToken(ExternalPlayerSource),
    );
    membershipRepo = module.get(getRepositoryToken(Membership));
    teamRepo = module.get(getRepositoryToken(Team));
    externalTeamSourceRepo = module.get(
      getRepositoryToken(ExternalTeamSource),
    );
    ucRegistrationsService = module.get(UCRegistrationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('discoverPlayersForLeague', () => {
    it('should discover players for all teams in a league', async () => {
      const leagueId = 'league-123';
      const provider = 'ultimate_central';

      const mockTeams = [
        {
          id: 'team-1',
          name: 'Team Alpha',
          externalSources: [{ source: provider, externalId: '101' }],
        },
        {
          id: 'team-2',
          name: 'Team Beta',
          externalSources: [{ source: provider, externalId: '102' }],
        },
      ];

      const mockLeague = {
        id: leagueId,
        externalSources: [{ provider, externalId: '999' }],
      };

      const mockRegistrations = {
        result: [
          {
            person_id: 1,
            Person: {
              email_address: 'player1@example.com',
              first_name: 'John',
              last_name: 'Doe',
              full_name: 'John Doe',
            },
          },
          {
            person_id: 2,
            Person: {
              email_address: 'player2@example.com',
              first_name: 'Jane',
              last_name: 'Smith',
              full_name: 'Jane Smith',
            },
          },
        ],
      };

      mockTeamRepo.find.mockResolvedValue(mockTeams as any);
      mockTeamRepo.findOne.mockResolvedValue(mockTeams[0] as any);
      mockTeamRepo.manager.findOne.mockResolvedValue(mockLeague as any);
      mockUCRegistrationsService.list.mockResolvedValue(
        mockRegistrations as any,
      );
      mockExternalPlayerSourceRepo.findOne.mockResolvedValue(null);
      mockPlayerRepo.create.mockImplementation((data) => data as any);
      mockPlayerRepo.save.mockImplementation((player) =>
        Promise.resolve({ ...player, id: 'player-' + Math.random() } as any),
      );
      mockExternalPlayerSourceRepo.create.mockImplementation(
        (data) => data as any,
      );
      mockExternalPlayerSourceRepo.save.mockResolvedValue({} as any);
      mockMembershipRepo.findOne.mockResolvedValue(null);
      mockMembershipRepo.create.mockImplementation((data) => data as any);
      mockMembershipRepo.save.mockResolvedValue({} as any);

      const result = await service.discoverPlayersForLeague(leagueId, provider);

      expect(mockTeamRepo.find).toHaveBeenCalledWith({
        where: { leagueId },
        relations: ['externalSources'],
      });
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array if no teams found', async () => {
      mockTeamRepo.find.mockResolvedValue([]);

      const result = await service.discoverPlayersForLeague(
        'league-123',
        'ultimate_central',
      );

      expect(result).toEqual([]);
    });
  });

  describe('discoverPlayersForTeam', () => {
    it('should create new players from UC registrations', async () => {
      const teamId = 'team-123';
      const leagueId = 'league-456';
      const provider = 'ultimate_central';

      const mockTeam = {
        id: teamId,
        name: 'Team Alpha',
        externalSources: [{ source: provider, externalId: '101' }],
      };

      const mockLeague = {
        id: leagueId,
        externalSources: [{ provider, externalId: '999' }],
      };

      const mockRegistrations = {
        result: [
          {
            person_id: 1,
            Person: {
              email_address: 'newplayer@example.com',
              first_name: 'New',
              last_name: 'Player',
              full_name: 'New Player',
            },
          },
        ],
      };

      mockTeamRepo.findOne.mockResolvedValue(mockTeam as any);
      mockTeamRepo.manager.findOne.mockResolvedValue(mockLeague as any);
      mockUCRegistrationsService.list.mockResolvedValue(
        mockRegistrations as any,
      );
      mockExternalPlayerSourceRepo.findOne.mockResolvedValue(null);
      mockPlayerRepo.create.mockImplementation((data) => data as any);
      mockPlayerRepo.save.mockResolvedValue({
        id: 'new-player-id',
        fullName: 'New Player',
        primaryEmail: 'newplayer@example.com',
      } as any);
      mockExternalPlayerSourceRepo.create.mockImplementation(
        (data) => data as any,
      );
      mockExternalPlayerSourceRepo.save.mockResolvedValue({
        provider,
        externalId: '1',
      } as any);
      mockMembershipRepo.findOne.mockResolvedValue(null);
      mockMembershipRepo.create.mockImplementation((data) => data as any);
      mockMembershipRepo.save.mockResolvedValue({} as any);

      const result = await service.discoverPlayersForTeam(
        teamId,
        leagueId,
        provider,
      );

      expect(result).toHaveLength(1);
      expect(result[0].fullName).toBe('New Player');
      expect(result[0].primaryEmail).toBe('newplayer@example.com');
      expect(mockPlayerRepo.save).toHaveBeenCalled();
      expect(mockExternalPlayerSourceRepo.save).toHaveBeenCalled();
      expect(mockMembershipRepo.save).toHaveBeenCalled();
    });

    it('should update existing players when found', async () => {
      const teamId = 'team-123';
      const leagueId = 'league-456';
      const provider = 'ultimate_central';

      const existingPlayer = {
        id: 'existing-player-id',
        fullName: 'Old Name',
        primaryEmail: 'old@example.com',
      };

      const existingSource = {
        provider,
        externalId: '1',
        player: existingPlayer,
      };

      const mockTeam = {
        id: teamId,
        externalSources: [{ source: provider, externalId: '101' }],
      };

      const mockLeague = {
        id: leagueId,
        externalSources: [{ provider, externalId: '999' }],
      };

      const mockRegistrations = {
        result: [
          {
            person_id: 1,
            Person: {
              email_address: 'updated@example.com',
              first_name: 'Updated',
              last_name: 'Name',
              full_name: 'Updated Name',
            },
          },
        ],
      };

      mockTeamRepo.findOne.mockResolvedValue(mockTeam as any);
      mockTeamRepo.manager.findOne.mockResolvedValue(mockLeague as any);
      mockUCRegistrationsService.list.mockResolvedValue(
        mockRegistrations as any,
      );
      mockExternalPlayerSourceRepo.findOne.mockResolvedValue(
        existingSource as any,
      );
      mockExternalPlayerSourceRepo.save.mockResolvedValue(
        existingSource as any,
      );
      mockPlayerRepo.save.mockResolvedValue({
        ...existingPlayer,
        fullName: 'Updated Name',
        primaryEmail: 'updated@example.com',
      } as any);
      mockMembershipRepo.findOne.mockResolvedValue(null);
      mockMembershipRepo.create.mockImplementation((data) => data as any);
      mockMembershipRepo.save.mockResolvedValue({} as any);

      const result = await service.discoverPlayersForTeam(
        teamId,
        leagueId,
        provider,
      );

      expect(result).toHaveLength(1);
      expect(mockPlayerRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Updated Name',
          primaryEmail: 'updated@example.com',
        }),
      );
    });

    it('should skip players without Person data', async () => {
      const teamId = 'team-123';
      const leagueId = 'league-456';
      const provider = 'ultimate_central';

      const mockTeam = {
        id: teamId,
        externalSources: [{ source: provider, externalId: '101' }],
      };

      const mockLeague = {
        id: leagueId,
        externalSources: [{ provider, externalId: '999' }],
      };

      const mockRegistrations = {
        result: [
          {
            person_id: 1,
            // No Person data
          },
        ],
      };

      mockTeamRepo.findOne.mockResolvedValue(mockTeam as any);
      mockTeamRepo.manager.findOne.mockResolvedValue(mockLeague as any);
      mockUCRegistrationsService.list.mockResolvedValue(
        mockRegistrations as any,
      );

      const result = await service.discoverPlayersForTeam(
        teamId,
        leagueId,
        provider,
      );

      expect(result).toHaveLength(0);
      expect(mockPlayerRepo.save).not.toHaveBeenCalled();
    });

    it('should not create duplicate memberships', async () => {
      const teamId = 'team-123';
      const leagueId = 'league-456';
      const provider = 'ultimate_central';

      const existingMembership = {
        id: 'membership-123',
        playerId: 'player-123',
        teamId,
        leagueId,
        isActive: true,
      };

      const mockTeam = {
        id: teamId,
        externalSources: [{ source: provider, externalId: '101' }],
      };

      const mockLeague = {
        id: leagueId,
        externalSources: [{ provider, externalId: '999' }],
      };

      const mockRegistrations = {
        result: [
          {
            person_id: 1,
            Person: {
              email_address: 'player@example.com',
              full_name: 'Player Name',
            },
          },
        ],
      };

      mockTeamRepo.findOne.mockResolvedValue(mockTeam as any);
      mockTeamRepo.manager.findOne.mockResolvedValue(mockLeague as any);
      mockUCRegistrationsService.list.mockResolvedValue(
        mockRegistrations as any,
      );
      mockExternalPlayerSourceRepo.findOne.mockResolvedValue(null);
      mockPlayerRepo.create.mockImplementation((data) => data as any);
      mockPlayerRepo.save.mockResolvedValue({
        id: 'player-123',
        fullName: 'Player Name',
      } as any);
      mockExternalPlayerSourceRepo.create.mockImplementation(
        (data) => data as any,
      );
      mockExternalPlayerSourceRepo.save.mockResolvedValue({} as any);
      mockMembershipRepo.findOne.mockResolvedValue(existingMembership as any);

      await service.discoverPlayersForTeam(teamId, leagueId, provider);

      expect(mockMembershipRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('arePlayersStale', () => {
    it('should return true if no players found', async () => {
      mockMembershipRepo.find.mockResolvedValue([]);

      const result = await service.arePlayersStale('team-123');

      expect(result).toBe(true);
    });

    it('should return true if players are older than 7 days', async () => {
      const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago

      const mockMemberships = [
        {
          player: {
            externalSources: [
              {
                lastSyncedAt: oldDate,
              },
            ],
          },
        },
      ];

      mockMembershipRepo.find.mockResolvedValue(mockMemberships as any);

      const result = await service.arePlayersStale('team-123');

      expect(result).toBe(true);
    });

    it('should return false if players are fresh', async () => {
      const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

      const mockMemberships = [
        {
          player: {
            externalSources: [
              {
                lastSyncedAt: recentDate,
              },
            ],
          },
        },
      ];

      mockMembershipRepo.find.mockResolvedValue(mockMemberships as any);

      const result = await service.arePlayersStale('team-123');

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw error if team not found', async () => {
      mockTeamRepo.findOne.mockResolvedValue(null);

      await expect(
        service.discoverPlayersForTeam(
          'nonexistent-team',
          'league-123',
          'ultimate_central',
        ),
      ).rejects.toThrow('Team nonexistent-team not found');
    });

    it('should throw error if team has no external source', async () => {
      const mockTeam = {
        id: 'team-123',
        externalSources: [],
      };

      mockTeamRepo.findOne.mockResolvedValue(mockTeam as any);

      await expect(
        service.discoverPlayersForTeam('team-123', 'league-123', 'ultimate_central'),
      ).rejects.toThrow(
        'No external source found for team team-123 with provider ultimate_central',
      );
    });

    it('should throw error for unsupported provider', async () => {
      const mockTeam = {
        id: 'team-123',
        externalSources: [{ source: 'zuluru', externalId: '101' }],
      };

      const mockLeague = {
        id: 'league-123',
        externalSources: [{ provider: 'zuluru', externalId: '999' }],
      };

      mockTeamRepo.findOne.mockResolvedValue(mockTeam as any);
      mockTeamRepo.manager.findOne.mockResolvedValue(mockLeague as any);

      await expect(
        service.discoverPlayersForTeam('team-123', 'league-123', 'zuluru'),
      ).rejects.toThrow('Provider zuluru not supported for player discovery');
    });
  });
});
