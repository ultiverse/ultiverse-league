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
import { getLeagues } from '../api/uc';
import { LeagueSummary } from '../types/api';
import { useLeague } from '../hooks/useLeague';
import { useNavigate } from 'react-router-dom';
import { SeasonChip } from '../components/SeasonChip.component';
import { formatStartDate } from '../helpers/season.helper';

interface LeaguesProps {
    onLeagueSelect?: () => void;
}


export function Leagues({ onLeagueSelect }: LeaguesProps = {}) {
    const { setSelectedLeague } = useLeague();
    const navigate = useNavigate();

    const leaguesQuery = useQuery({
        queryKey: ['leagues'],
        queryFn: getLeagues,
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
                                        <SeasonChip dateStr={league.start} />
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