import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Stack,
  CircularProgress,
  Alert,
  Grid,
  Box,
} from '@mui/material';
import { PROVIDERS } from '@ultiverse/shared-types';
import { getAllLeagues, MeLeague } from '../api/user';
import { useAuth } from '../hooks/useAuth';
import { LeagueCard } from '../components/Leagues/LeagueCard';
import { LeaguesEmptyState } from '../components/Leagues/LeaguesEmptyState';
import { LeaguesHeader } from '../components/Leagues/LeaguesHeader';
import { useLeague } from '../hooks/useLeague';
import { LeagueSummary, DataSource, SyncStatus } from '../types/api';

export function LeaguesListPage() {
  const navigate = useNavigate();
  const { email } = useAuth();
  const { setSelectedLeague } = useLeague();

  const handleSelectLeague = async (league: MeLeague) => {
    // Convert MeLeague to LeagueSummary format
    const normalizedSource: DataSource = league.source as DataSource;

    const normalizedSyncStatus: SyncStatus =
      (league.syncStatus as SyncStatus) || 'synced';

    const leagueSummary: LeagueSummary = {
      id: league.id,
      name: league.name,
      start: league.seasonStart,
      end: league.seasonEnd,
      source: normalizedSource,
      syncStatus: normalizedSyncStatus,
      integrationProvider: league.badge === 'UC' ? PROVIDERS.ULTIMATE_CENTRAL : undefined,
    };

    // Set the selected league in context
    setSelectedLeague(leagueSummary);
    console.log('Selected league:', leagueSummary);

    // Always trigger league import/refresh to ensure data is loaded
    // Use force=true if never synced or sync status is not active
    const shouldForce = !league.lastSyncedAt || league.syncStatus !== 'active';
    const refreshUrl = `/api/v1/leagues/${league.id}/refresh${shouldForce ? '?force=true' : ''}`;

    console.log(`Triggering league import for: ${league.name}${shouldForce ? ' (force)' : ''}`);
    try {
      await fetch(refreshUrl, {
        method: 'POST',
      });
      console.log('League import started');
    } catch (error) {
      console.error('Failed to trigger league import:', error);
    }

    // Navigate to teams page
    navigate('/teams');
  };

  const leaguesQuery = useQuery({
    queryKey: ['leagues', 'all'],
    queryFn: async () => {
      const leagues = await getAllLeagues();
      // Transform to LeagueSummary format for consistency
      return leagues;
    },
    staleTime: 60_000, // 1 minute
  });

  const handleRefresh = () => {
    leaguesQuery.refetch();
  };

  const handleConnectIntegration = () => {
    navigate('/integrations');
  };

  const hasLeagues = leaguesQuery.data && leaguesQuery.data.length > 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <LeaguesHeader
          email={email || ''}
          onRefresh={handleRefresh}
          onConnectIntegration={handleConnectIntegration}
          isRefreshing={leaguesQuery.isFetching}
        />

        {/* Loading State */}
        {leaguesQuery.isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {leaguesQuery.isError && (
          <Alert severity="error">
            Failed to load leagues: {String(leaguesQuery.error)}
          </Alert>
        )}

        {/* Empty State */}
        {!leaguesQuery.isLoading && !hasLeagues && (
          <LeaguesEmptyState onConnectIntegration={handleConnectIntegration} />
        )}

        {/* Leagues Grid */}
        {hasLeagues && (
          <Grid container spacing={3}>
            {leaguesQuery.data.map((league) => (
              <Grid
                key={league.id}
                size={{ xs: 12, sm: 6, md: 4 }}
                display="flex"
              >
                <LeagueCard league={league} onSelect={handleSelectLeague} />
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
