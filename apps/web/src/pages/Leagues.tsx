import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { getLeagues } from '../api/uc';
import { useLeague } from '../context/LeagueContext';
import { useNavigate } from 'react-router-dom';

interface LeaguesProps {
  onLeagueSelect?: () => void;
}

function getSeason(dateStr?: string): string {
  if (!dateStr) return 'Unknown';

  try {
    const date = new Date(dateStr);
    const month = date.getMonth(); // 0-11

    if (month >= 2 && month <= 4) return 'Spring'; // Mar, Apr, May
    if (month >= 5 && month <= 7) return 'Summer'; // Jun, Jul, Aug
    if (month >= 8 && month <= 10) return 'Fall'; // Sep, Oct, Nov
    return 'Winter'; // Dec, Jan, Feb
  } catch {
    return 'Unknown';
  }
}

function formatStartDate(dateStr?: string): string {
  if (!dateStr) return 'Date not available';

  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
}

function getSeasonColor(season: string): 'primary' | 'secondary' | 'success' | 'warning' {
  switch (season) {
    case 'Spring': return 'success';
    case 'Summer': return 'warning';
    case 'Fall': return 'primary';
    case 'Winter': return 'secondary';
    default: return 'secondary';
  }
}

export function Leagues({ onLeagueSelect }: LeaguesProps = {}) {
  const { setSelectedLeague } = useLeague();
  const navigate = useNavigate();

  const leaguesQuery = useQuery({
    queryKey: ['leagues'],
    queryFn: getLeagues
  });

  const handleLeagueSelect = (league: any) => {
    setSelectedLeague(league);
    onLeagueSelect?.(); // Close modal if callback provided
    navigate('/teams');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Select a League
      </Typography>

      {leaguesQuery.isLoading && <CircularProgress />}
      {leaguesQuery.isError && (
        <Alert severity="error">{String(leaguesQuery.error)}</Alert>
      )}

      {leaguesQuery.data && (
        <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>League Name</TableCell>
                <TableCell>Season</TableCell>
                <TableCell>Start Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaguesQuery.data.map((league) => (
                <TableRow
                  key={league.id}
                  hover
                  onClick={() => handleLeagueSelect(league)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {league.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getSeason(league.start)}
                      color={getSeasonColor(getSeason(league.start))}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatStartDate(league.start)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}