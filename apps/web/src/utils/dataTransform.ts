import { PROVIDERS, DATA_SOURCES } from '@ultiverse/shared-types';
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
            [PROVIDERS.ULTIVERSE]: DATA_SOURCES.ULTIVERSE,
            [PROVIDERS.ULTIMATE_CENTRAL]: DATA_SOURCES.ULTIMATE_CENTRAL,
            [PROVIDERS.ZULURU]: DATA_SOURCES.ZULURU,
        };

        // Map badge to IntegrationProvider
        const providerMap: Record<MeLeague['badge'], IntegrationProvider | undefined> = {
            'UV': undefined,
            'UC': PROVIDERS.ULTIMATE_CENTRAL,
            'Z': PROVIDERS.ZULURU,
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
        source: DATA_SOURCES.ULTIMATE_CENTRAL,
        syncStatus: 'synced' as SyncStatus,
        integrationProvider: PROVIDERS.ULTIMATE_CENTRAL,
        lastSynced: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(), // Random time within last 24h
    }));
}

export function transformTeamData(teams: TeamSummary[]): TeamSummary[] {
    // The backend now provides source, syncStatus, and integrationProvider fields
    // Just return the teams as-is
    return teams;
}

/**
 * Utility to create mock Ultiverse-only data
 */
export function createMockUltiverseLeague(name: string): LeagueSummary {
    return {
        id: `ultiverse-${Date.now()}`,
        name,
        start: new Date().toISOString(),
        source: DATA_SOURCES.ULTIVERSE,
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
        source: DATA_SOURCES.ULTIVERSE,
        syncStatus: 'never_synced',
        lastSynced: null,
    };
}