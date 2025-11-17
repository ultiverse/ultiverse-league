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
} from '@mui/material';
import { getAllLeagues } from '../api/user';
import { LeagueSummary } from '../types/api';
import { useLeague } from '../hooks/useLeague';
import { useNavigate } from 'react-router-dom';
import { SeasonChip } from '../components/SeasonChip.component';
import { SourceBadge } from '../components/SourceBadge.component';
import { transformMeLeagueData } from '../utils/dataTransform';

interface LeaguesProps {
    onLeagueSelect?: () => void;
}


export function Leagues({ onLeagueSelect }: LeaguesProps = {}) {
    const { setSelectedLeague } = useLeague();
    const navigate = useNavigate();

    const leaguesQuery = useQuery({
        queryKey: ['leagues', 'all'],
        queryFn: async () => {
            const rawLeagues = await getAllLeagues();
            return transformMeLeagueData(rawLeagues);
        },
        staleTime: 15 * 60 * 1000, // 15 minutes - leagues don't change very often
        gcTime: 30 * 60 * 1000, // 30 minutes cache retention
    });

    const handleLeagueSelect = (league: LeagueSummary) => {
        console.log('Selected league:', league);
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
                <Alert severity="error">
                    Failed to load leagues: {leaguesQuery.error instanceof Error ? leaguesQuery.error.message : String(leaguesQuery.error)}
                </Alert>
            )}

            {leaguesQuery.data && leaguesQuery.data.length === 0 && (
                <Alert severity="info">
                    No leagues found. Connect an integration to import your leagues.
                </Alert>
            )}

            {leaguesQuery.data && leaguesQuery.data.length > 0 && (
                <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>League Name</TableCell>
                                <TableCell>Source</TableCell>
                                <TableCell>Season</TableCell>
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
                                        <SourceBadge
                                            source={league.source}
                                            integrationProvider={league.integrationProvider}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <SeasonChip dateStr={league.start} />
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