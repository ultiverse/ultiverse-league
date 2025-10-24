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
import { getAllLeagues, MeLeague } from '../api/user';
import { useAuth } from '../context/AuthContext';
import { LeagueCard } from '../components/Leagues/LeagueCard';
import { LeaguesEmptyState } from '../components/Leagues/LeaguesEmptyState';
import { LeaguesHeader } from '../components/Leagues/LeaguesHeader';
import { useLeague } from '../hooks/useLeague';
import { LeagueSummary } from '../types/api';

export function LeaguesListPage() {
  const navigate = useNavigate();
  const { email } = useAuth();
  const { setSelectedLeague } = useLeague();

  const handleSelectLeague = (league: MeLeague) => {
    // Convert MeLeague to LeagueSummary format
    const leagueSummary: LeagueSummary = {
      id: league.id,
      name: league.name,
      start: league.seasonStart,
      end: league.seasonEnd,
      source: league.source === 'ultimate_central' ? 'uc' : league.source as any,
      syncStatus: (league.syncStatus as any) || 'synced',
      integrationProvider: league.badge === 'UC' ? 'uc' : undefined,
    };

    // Set the selected league in context
    setSelectedLeague(leagueSummary);
    console.log('Selected league:', leagueSummary);

    // Navigate to teams page
    navigate('/teams');
  };

  const leaguesQuery = useQuery({
    queryKey: ['leagues', 'all'],
    queryFn: () => getAllLeagues(),
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
              <Grid item xs={12} sm={6} md={4} key={league.id}>
                <LeagueCard league={league} onSelect={handleSelectLeague} />
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
