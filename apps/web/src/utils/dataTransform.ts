import { LeagueSummary, TeamSummary, DataSource, SyncStatus, IntegrationProvider } from '../types/api';
import { MeLeague } from '../api/user';

/**
 * Transform API data to include source and sync status information
 * This is a temporary solution until the backend provides these fields
 */

/**
 * Transform MeLeague from /api/v1/leagues to LeagueSummary
 */
export function transformMeLeagueData(leagues: MeLeague[]): LeagueSummary[] {
    return leagues.map(league => {
        // Map source to DataSource type
        const sourceMap: Record<MeLeague['source'], DataSource> = {
            'ultiverse': 'ultiverse',
            'ultimate_central': 'uc',
            'zuluru': 'zuluru',
        };

        // Map badge to IntegrationProvider
        const providerMap: Record<MeLeague['badge'], IntegrationProvider | undefined> = {
            'UV': undefined,
            'UC': 'uc',
            'Z': 'zuluru',
        };

        return {
            id: league.id,
            name: league.name,
            start: league.seasonStart,
            end: league.seasonEnd,
            source: sourceMap[league.source],
            syncStatus: (league.syncStatus || 'synced') as SyncStatus,
            integrationProvider: providerMap[league.badge],
            lastSynced: league.lastSyncedAt || null,
        };
    });
}

export function transformLeagueData(leagues: Omit<LeagueSummary, 'source' | 'syncStatus' | 'integrationProvider'>[]): LeagueSummary[] {
    return leagues.map(league => ({
        ...league,
        // For now, assume all leagues come from UC (Ultimate Central)
        source: 'uc' as DataSource,
        syncStatus: 'synced' as SyncStatus,
        integrationProvider: 'uc' as IntegrationProvider,
        lastSynced: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(), // Random time within last 24h
    }));
}

export function transformTeamData(teams: Omit<TeamSummary, 'source' | 'syncStatus' | 'integrationProvider'>[]): TeamSummary[] {
    return teams.map((team, index) => {
        // Simulate different data sources for demo purposes
        let source: DataSource;
        let syncStatus: SyncStatus;
        let integrationProvider: IntegrationProvider | undefined;

        if (index % 4 === 0) {
            // Every 4th team is local-only
            source = 'ultiverse';
            syncStatus = 'never_synced';
            integrationProvider = undefined;
        } else if (index % 4 === 1) {
            // Some teams need pulling
            source = 'uc';
            syncStatus = 'needs_pull';
            integrationProvider = 'uc';
        } else if (index % 4 === 2) {
            // Some teams need pushing
            source = 'both';
            syncStatus = 'needs_push';
            integrationProvider = 'uc';
        } else {
            // Rest are synced
            source = 'uc';
            syncStatus = 'synced';
            integrationProvider = 'uc';
        }

        return {
            ...team,
            source,
            syncStatus,
            integrationProvider,
            lastSynced: syncStatus === 'never_synced'
                ? null
                : new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random time within last week
        };
    });
}

/**
 * Utility to create mock Ultiverse-only data
 */
export function createMockUltiverseLeague(name: string): LeagueSummary {
    return {
        id: `ultiverse-${Date.now()}`,
        name,
        start: new Date().toISOString(),
        source: 'ultiverse',
        syncStatus: 'never_synced',
        lastSynced: null,
    };
}

export function createMockUltiverseTeam(name: string, colour: string = '#1976d2'): TeamSummary {
    return {
        id: `ultiverse-team-${Date.now()}`,
        name,
        colour,
        altColour: '#ffffff',
        source: 'ultiverse',
        syncStatus: 'never_synced',
        lastSynced: null,
    };
}