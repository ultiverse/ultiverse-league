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
import { getMyLeagues } from '../api/user';
import { useAuth } from '../context/AuthContext';
import { LeagueCard } from '../components/Leagues/LeagueCard';
import { LeaguesEmptyState } from '../components/Leagues/LeaguesEmptyState';
import { LeaguesHeader } from '../components/Leagues/LeaguesHeader';
import { ConnectionStatus } from '../components/Leagues/ConnectionStatus';

export function LeaguesListPage() {
  const navigate = useNavigate();
  const { email } = useAuth();

  const leaguesQuery = useQuery({
    queryKey: ['me', 'leagues'],
    queryFn: () => getMyLeagues('if-stale'),
    staleTime: 60_000, // 1 minute
  });

  const handleRefresh = () => {
    leaguesQuery.refetch();
  };

  const handleConnectIntegration = () => {
    navigate('/integrations');
  };

  const hasLeagues = leaguesQuery.data && leaguesQuery.data.leagues.length > 0;

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

        {/* Connection Status */}
        {leaguesQuery.data?.connections && (
          <ConnectionStatus connections={leaguesQuery.data.connections} />
        )}

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
            {leaguesQuery.data.leagues.map((league) => (
              <Grid item xs={12} sm={6} md={4} key={league.id}>
                <LeagueCard league={league} />
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
