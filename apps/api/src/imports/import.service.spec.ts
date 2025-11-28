import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImportService } from './import.service';
import {
  League,
  ExternalLeagueSource,
  Team,
  ExternalTeamSource,
  Membership,
  Organization,
} from '../database/entities';

const identity = <T>(value: T): T => value;

describe('ImportService', () => {
  let service: ImportService;
  let leagueRepo: jest.Mocked<Repository<League>>;
  let externalLeagueSourceRepo: jest.Mocked<Repository<ExternalLeagueSource>>;
  let teamRepo: jest.Mocked<Repository<Team>>;
  let externalTeamSourceRepo: jest.Mocked<Repository<ExternalTeamSource>>;
  let membershipRepo: jest.Mocked<Repository<Membership>>;
  let organizationRepo: jest.Mocked<Repository<Organization>>;

  const mockLeagueRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockExternalLeagueSourceRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTeamRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockExternalTeamSourceRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockMembershipRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockOrganizationRepo = {
    findOne: jest.fn(),
  };

  const mockAdapter = {
    fetchLeague: jest.fn(),
    fetchTeams: jest.fn(),
    fetchPlayers: jest.fn(),
    listMyLeagues: jest.fn(),
  };

  const mockPlayerDiscoveryService = {
    discoverPlayersForLeague: jest.fn(),
  };

  const mockGameDiscoveryService = {
    discoverGamesForLeague: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportService,
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
          provide: getRepositoryToken(Membership),
          useValue: mockMembershipRepo,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrganizationRepo,
        },
      ],
    }).compile();

    service = module.get<ImportService>(ImportService);
    leagueRepo = module.get(getRepositoryToken(League));
    externalLeagueSourceRepo = module.get(
      getRepositoryToken(ExternalLeagueSource),
    );
    teamRepo = module.get(getRepositoryToken(Team));
    externalTeamSourceRepo = module.get(getRepositoryToken(ExternalTeamSource));
    membershipRepo = module.get(getRepositoryToken(Membership));
    organizationRepo = module.get(getRepositoryToken(Organization));

    // Register mock adapter
    service.registerAdapter('uc', mockAdapter);
    service.setPlayerDiscoveryService(mockPlayerDiscoveryService);
    service.setGameDiscoveryService(mockGameDiscoveryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('importLeague', () => {
    it('should import league, teams, players, and games in sequence', async () => {
      const provider = 'uc';
      const leagueKey = { provider, externalId: '999' };
      const userId = 'user-123';
      const organizationId = 'org-123';

      const mockExternalLeague = {
        externalId: '999',
        name: 'Summer League 2025',
        seasonStart: new Date('2025-06-01'),
        seasonEnd: new Date('2025-08-31'),
        rawData: {},
      };

      const mockExternalTeams = [
        {
          externalId: '101',
          name: 'Team Alpha',
          colour: '#FF0000',
          altColour: '#FFFFFF',
          rawData: {},
        },
        {
          externalId: '102',
          name: 'Team Beta',
          colour: '#0000FF',
          altColour: '#FFFFFF',
          rawData: {},
        },
      ];

      const mockSavedLeague = {
        id: 'league-123',
        organizationId,
        name: 'Summer League 2025',
        sourceType: provider,
      };

      const mockSavedTeam = {
        id: 'team-123',
        leagueId: 'league-123',
        name: 'Team Alpha',
        sourceType: provider,
      };

      mockAdapter.fetchLeague.mockResolvedValue(mockExternalLeague);
      mockAdapter.fetchTeams.mockResolvedValue(mockExternalTeams);
      mockExternalLeagueSourceRepo.findOne.mockResolvedValue(null);
      mockLeagueRepo.create.mockReturnValue(mockSavedLeague as any);
      mockLeagueRepo.save.mockResolvedValue(mockSavedLeague as any);
      mockExternalLeagueSourceRepo.create.mockImplementation(identity);
      mockExternalLeagueSourceRepo.save.mockResolvedValue({} as any);
      mockExternalTeamSourceRepo.findOne.mockResolvedValue(null);
      mockTeamRepo.create.mockReturnValue(mockSavedTeam as any);
      mockTeamRepo.save.mockResolvedValue(mockSavedTeam as any);
      mockTeamRepo.findOne.mockResolvedValue({
        seasonStart: new Date(),
      } as any);
      mockExternalTeamSourceRepo.create.mockImplementation(identity);
      mockExternalTeamSourceRepo.save.mockResolvedValue({} as any);
      mockMembershipRepo.findOne.mockResolvedValue(null);
      mockMembershipRepo.create.mockImplementation(identity);
      mockMembershipRepo.save.mockResolvedValue({} as any);
      mockPlayerDiscoveryService.discoverPlayersForLeague.mockResolvedValue([
        { id: 'player-1', fullName: 'John Doe' },
        { id: 'player-2', fullName: 'Jane Smith' },
      ]);
      mockGameDiscoveryService.discoverGamesForLeague.mockResolvedValue([
        { id: 'game-1', homeTeamId: 'team-1', awayTeamId: 'team-2' },
        { id: 'game-2', homeTeamId: 'team-2', awayTeamId: 'team-1' },
      ]);

      const result = await service.importLeague(
        provider,
        leagueKey,
        userId,
        organizationId,
      );

      // Verify league import
      expect(mockAdapter.fetchLeague).toHaveBeenCalledWith(leagueKey);
      expect(mockLeagueRepo.save).toHaveBeenCalled();

      // Verify teams import
      expect(mockAdapter.fetchTeams).toHaveBeenCalledWith(leagueKey);
      expect(mockTeamRepo.save).toHaveBeenCalledTimes(2);

      // Verify players discovery
      expect(
        mockPlayerDiscoveryService.discoverPlayersForLeague,
      ).toHaveBeenCalledWith('league-123', provider);

      // Verify games discovery
      expect(
        mockGameDiscoveryService.discoverGamesForLeague,
      ).toHaveBeenCalledWith('league-123', provider);

      expect(result).toBe('league-123');
    });

    it('should update existing league instead of creating new one', async () => {
      const provider = 'uc';
      const leagueKey = { provider, externalId: '999' };
      const userId = 'user-123';
      const organizationId = 'org-123';

      const existingLeague = {
        id: 'existing-league-id',
        name: 'Old Name',
        isEditable: false,
      };

      const existingSource = {
        leagueId: 'existing-league-id',
        provider,
        externalId: '999',
        league: existingLeague,
      };

      const mockExternalLeague = {
        externalId: '999',
        name: 'Updated League Name',
        seasonStart: new Date('2025-06-01'),
        seasonEnd: new Date('2025-08-31'),
        rawData: {},
      };

      mockAdapter.fetchLeague.mockResolvedValue(mockExternalLeague);
      mockAdapter.fetchTeams.mockResolvedValue([]);
      mockExternalLeagueSourceRepo.findOne.mockResolvedValue(
        existingSource as any,
      );
      mockExternalLeagueSourceRepo.save.mockResolvedValue(
        existingSource as any,
      );
      mockLeagueRepo.save.mockResolvedValue(existingLeague as any);
      mockPlayerDiscoveryService.discoverPlayersForLeague.mockResolvedValue([]);
      mockGameDiscoveryService.discoverGamesForLeague.mockResolvedValue([]);

      const result = await service.importLeague(
        provider,
        leagueKey,
        userId,
        organizationId,
      );

      expect(mockLeagueRepo.create).not.toHaveBeenCalled();
      expect(mockLeagueRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated League Name',
        }),
      );
      expect(result).toBe('existing-league-id');
    });

    it('should continue if player discovery fails', async () => {
      const provider = 'uc';
      const leagueKey = { provider, externalId: '999' };
      const userId = 'user-123';
      const organizationId = 'org-123';

      const mockExternalLeague = {
        externalId: '999',
        name: 'Test League',
        rawData: {},
      };

      const mockSavedLeague = {
        id: 'league-123',
        name: 'Test League',
      };

      mockAdapter.fetchLeague.mockResolvedValue(mockExternalLeague);
      mockAdapter.fetchTeams.mockResolvedValue([]);
      mockExternalLeagueSourceRepo.findOne.mockResolvedValue(null);
      mockLeagueRepo.create.mockReturnValue(mockSavedLeague as any);
      mockLeagueRepo.save.mockResolvedValue(mockSavedLeague as any);
      mockExternalLeagueSourceRepo.create.mockImplementation(identity);
      mockExternalLeagueSourceRepo.save.mockResolvedValue({} as any);
      mockPlayerDiscoveryService.discoverPlayersForLeague.mockRejectedValue(
        new Error('UC API error'),
      );
      mockGameDiscoveryService.discoverGamesForLeague.mockResolvedValue([]);

      // Should not throw even if player discovery fails
      await expect(
        service.importLeague(provider, leagueKey, userId, organizationId),
      ).resolves.toBe('league-123');

      // Games discovery should still run
      expect(
        mockGameDiscoveryService.discoverGamesForLeague,
      ).toHaveBeenCalled();
    });

    it('should continue if game discovery fails', async () => {
      const provider = 'uc';
      const leagueKey = { provider, externalId: '999' };
      const userId = 'user-123';
      const organizationId = 'org-123';

      const mockExternalLeague = {
        externalId: '999',
        name: 'Test League',
        rawData: {},
      };

      const mockSavedLeague = {
        id: 'league-123',
        name: 'Test League',
      };

      mockAdapter.fetchLeague.mockResolvedValue(mockExternalLeague);
      mockAdapter.fetchTeams.mockResolvedValue([]);
      mockExternalLeagueSourceRepo.findOne.mockResolvedValue(null);
      mockLeagueRepo.create.mockReturnValue(mockSavedLeague as any);
      mockLeagueRepo.save.mockResolvedValue(mockSavedLeague as any);
      mockExternalLeagueSourceRepo.create.mockImplementation(identity);
      mockExternalLeagueSourceRepo.save.mockResolvedValue({} as any);
      mockPlayerDiscoveryService.discoverPlayersForLeague.mockResolvedValue([]);
      mockGameDiscoveryService.discoverGamesForLeague.mockRejectedValue(
        new Error('UC API error'),
      );

      // Should not throw even if game discovery fails
      await expect(
        service.importLeague(provider, leagueKey, userId, organizationId),
      ).resolves.toBe('league-123');
    });

    it('should not call discovery services if they are not set', async () => {
      // Create a new service without discovery services
      const newService = new ImportService(
        leagueRepo,
        externalLeagueSourceRepo,
        teamRepo,
        externalTeamSourceRepo,
        membershipRepo,
        organizationRepo,
      );

      newService.registerAdapter('uc', mockAdapter);

      const provider = 'uc';
      const leagueKey = { provider, externalId: '999' };

      const mockExternalLeague = {
        externalId: '999',
        name: 'Test League',
        rawData: {},
      };

      const mockSavedLeague = {
        id: 'league-123',
        name: 'Test League',
      };

      mockAdapter.fetchLeague.mockResolvedValue(mockExternalLeague);
      mockAdapter.fetchTeams.mockResolvedValue([]);
      mockExternalLeagueSourceRepo.findOne.mockResolvedValue(null);
      mockLeagueRepo.create.mockReturnValue(mockSavedLeague as any);
      mockLeagueRepo.save.mockResolvedValue(mockSavedLeague as any);
      mockExternalLeagueSourceRepo.create.mockImplementation(identity);
      mockExternalLeagueSourceRepo.save.mockResolvedValue({} as any);

      await newService.importLeague(provider, leagueKey, 'user-123', 'org-123');

      // Discovery services should not be called
      expect(
        mockPlayerDiscoveryService.discoverPlayersForLeague,
      ).not.toHaveBeenCalled();
      expect(
        mockGameDiscoveryService.discoverGamesForLeague,
      ).not.toHaveBeenCalled();
    });
  });

  describe('refreshLeague', () => {
    it('should re-import league with existing data', async () => {
      const leagueId = 'league-123';

      const existingSource = {
        leagueId,
        provider: 'uc',
        externalId: '999',
        league: {
          id: leagueId,
          organizationId: 'org-123',
          name: 'Test League',
        },
      };

      mockExternalLeagueSourceRepo.findOne.mockResolvedValue(
        existingSource as any,
      );
      mockAdapter.fetchLeague.mockResolvedValue({
        externalId: '999',
        name: 'Updated League',
        rawData: {},
      });
      mockAdapter.fetchTeams.mockResolvedValue([]);
      mockExternalLeagueSourceRepo.save.mockResolvedValue(
        existingSource as any,
      );
      mockLeagueRepo.save.mockResolvedValue(existingSource.league as any);
      mockPlayerDiscoveryService.discoverPlayersForLeague.mockResolvedValue([]);
      mockGameDiscoveryService.discoverGamesForLeague.mockResolvedValue([]);

      await service.refreshLeague(leagueId);

      expect(mockAdapter.fetchLeague).toHaveBeenCalledWith({
        provider: 'uc',
        externalId: '999',
      });
      expect(
        mockPlayerDiscoveryService.discoverPlayersForLeague,
      ).toHaveBeenCalled();
      expect(
        mockGameDiscoveryService.discoverGamesForLeague,
      ).toHaveBeenCalled();
    });

    it('should throw error if league has no external source', async () => {
      mockExternalLeagueSourceRepo.findOne.mockResolvedValue(null);

      await expect(service.refreshLeague('league-123')).rejects.toThrow(
        'League league-123 has no external source',
      );
    });
  });

  describe('adapter registration', () => {
    it('should register and retrieve adapters', () => {
      const newAdapter = { ...mockAdapter };

      service.registerAdapter('test-provider', newAdapter);

      // This will throw if adapter is not found
      expect(() => {
        service['getAdapter']('test-provider');
      }).not.toThrow();
    });

    it('should throw error for unregistered adapter', () => {
      expect(() => {
        service['getAdapter']('unregistered-provider');
      }).toThrow('No adapter registered for provider: unregistered-provider');
    });
  });

  describe('isLeagueStale', () => {
    it('should return false if league was synced recently', () => {
      const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

      const result = service.isLeagueStale(recentDate);

      expect(result).toBe(false);
    });

    it('should return true if league was synced more than 7 days ago', () => {
      const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago

      const result = service.isLeagueStale(oldDate);

      expect(result).toBe(true);
    });

    it('should return false if lastSyncedAt is undefined', () => {
      const result = service.isLeagueStale(undefined);

      expect(result).toBe(false);
    });
  });
});
