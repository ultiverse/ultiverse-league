import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    Box, Container, Typography, Card, CardActionArea, CardContent,
    Grid, CircularProgress, Alert, Button
} from '@mui/material';
import { getLeagues, getTeamsByLeague, generateSchedule, LeagueSummary, TeamSummary } from './api/uc';
import { ScheduleView, TeamSide } from '@ultiverse/shared-types';

function formatStartDate(dateStr?: string): string {
    if (!dateStr) return 'Date not available';

    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    } catch {
        return 'Invalid date';
    }
}

function getTeamDisplay(teamSide: TeamSide, teamNames?: Record<string, string>): string {
    if ('teamName' in teamSide && teamSide.teamName) {
        return teamSide.teamName;
    }

    if ('pods' in teamSide && teamSide.pods) {
        const podNames = teamSide.pods.map(podId =>
            teamNames?.[podId] || `Pod ${podId}`
        );
        return podNames.join(' + ');
    }

    if ('teamId' in teamSide) {
        return teamNames?.[teamSide.teamId] || `Team ${teamSide.teamId}`;
    }

    return 'Unknown Team';
}

export function App() {
    const [selectedLeague, setSelectedLeague] = useState<LeagueSummary | null>(null);
    const [generatedSchedule, setGeneratedSchedule] = useState<ScheduleView | null>(null);
    const [teamNames, setTeamNames] = useState<Record<string, string>>({});

    const leaguesQ = useQuery({
        queryKey: ['leagues'],
        queryFn: getLeagues
    });

    const teamsQ = useQuery({
        queryKey: ['teams', selectedLeague?.id],
        queryFn: () => getTeamsByLeague(selectedLeague!.id),
        enabled: !!selectedLeague
    });

    const generateScheduleMutation = useMutation({
        mutationFn: generateSchedule,
        onSuccess: (schedule) => {
            setGeneratedSchedule(schedule);
        },
        onError: (error) => {
            console.error('Failed to generate schedule:', error);
        }
    });

    const handleGenerateSchedule = () => {
        const teams = teamsQ.data || [];
        if (teams.length < 4) {
            alert('Need at least 4 teams to generate a schedule');
            return;
        }

        const names = teams.reduce((acc, team) => {
            acc[team.id] = team.name;
            return acc;
        }, {} as Record<string, string>);

        setTeamNames(names);

        generateScheduleMutation.mutate({
            pods: teams.map(team => team.id),
            rounds: 8, // Default 8 rounds for comprehensive scheduling
            recencyWindow: 2, // Allow some recency control for better variety
            names,
            leagueId: selectedLeague?.id,
        });
    };
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                Ultiverse League Manager
            </Typography>

            {!selectedLeague && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Select a League
                    </Typography>
                    {leaguesQ.isLoading && <CircularProgress />}
                    {leaguesQ.isError && <Alert severity="error">{String(leaguesQ.error)}</Alert>}
                    <Grid container spacing={2}>
                        {(leaguesQ?.data ?? []).map((lg) => (
                            <Grid key={lg.id} size={{ xs: 12, sm: 6 }}>
                                <Card>
                                    <CardActionArea onClick={() => setSelectedLeague(lg)}>
                                        <CardContent>
                                            <Typography variant="subtitle1">{lg.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">{formatStartDate(lg.start)}</Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {selectedLeague && (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                        <Button variant="outlined" onClick={() => setSelectedLeague(null)}>Back</Button>
                        <Typography variant="h6">Teams in: {selectedLeague.name}</Typography>
                    </Box>
                    {teamsQ.isLoading && <CircularProgress />}
                    {teamsQ.isError && <Alert severity="error">{String(teamsQ.error)}</Alert>}
                    <Grid container spacing={2}>
                        {(teamsQ.data ?? []).map((t: TeamSummary) => (
                            <Grid key={t.id} size={{ xs: 12, sm: 6 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="subtitle1">{t.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">{t.division || 'Team'}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                    {teamsQ.data && teamsQ.data.length > 0 && (
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleGenerateSchedule}
                                disabled={generateScheduleMutation.isPending}
                            >
                                {generateScheduleMutation.isPending ? 'Generating Schedule...' : 'Generate Schedule (8 Rounds)'}
                            </Button>
                        </Box>
                    )}
                    {teamsQ.data?.length === 0 && (
                        <Alert sx={{ mt: 2 }} severity="info">No teams found for this league.</Alert>
                    )}
                </Box>
            )}

            {generatedSchedule && (
                <Box sx={{ mt: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                        <Button variant="outlined" onClick={() => setGeneratedSchedule(null)}>Back to Teams</Button>
                        <Typography variant="h6">Generated Schedule</Typography>
                    </Box>

                    {generatedSchedule.rounds.filter(round => round.games.length > 0).map((round, roundIndex) => (
                        <Box key={roundIndex} sx={{ mb: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>Round {round.round}</Typography>
                            <Grid container spacing={2}>
                                {round.games.map((game, gameIndex) => (
                                    <Grid key={gameIndex} size={{ xs: 12, md: 6 }}>
                                        <Card>
                                            <CardContent>
                                                <Typography variant="subtitle1">
                                                    {getTeamDisplay(game.home, teamNames)} vs {getTeamDisplay(game.away, teamNames)}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {new Date(game.start).toLocaleString()}
                                                </Typography>
                                                {game.field && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        Field: {game.field}
                                                    </Typography>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    ))}

                    {generateScheduleMutation.isError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            Failed to generate schedule: {String(generateScheduleMutation.error)}
                        </Alert>
                    )}
                </Box>
            )}
        </Container>
    );
}
