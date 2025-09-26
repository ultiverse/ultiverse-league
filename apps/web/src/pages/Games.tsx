import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Grid,
    CircularProgress,
    Alert,
    Button,
    TextField,
    Checkbox,
    FormControlLabel,
} from '@mui/material';
import { getTeamsByLeague, generateSchedule, TeamSummary } from '@/api/uc';
import { useLeague } from '@/hooks/useLeague';
import { ScheduleView, TeamSide } from '@ultiverse/shared-types';
import { GameCard } from '@/components/GameCard';
import { Section } from '@/components/Section';

function getTeamDisplayName(teamSide: TeamSide, teamNames?: Record<string, string>): string {
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

function getTeamColor(teamSide: TeamSide, teamData?: Record<string, { id: string; name: string; colour: string; }>): string {
    // For pods, use default black color
    if ('pods' in teamSide && teamSide.pods) {
        return '#000000';
    }

    if ('teamId' in teamSide) {
        return teamData?.[teamSide.teamId]?.colour || '#000000';
    }

    return '#000000';
}

export function Games() {
    const { selectedLeague } = useLeague();
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [rounds, setRounds] = useState(8);
    const [generatedSchedule, setGeneratedSchedule] = useState<ScheduleView | null>(null);
    const [teamNames, setTeamNames] = useState<Record<string, string>>({});
    const [teamData, setTeamData] = useState<Record<string, { id: string; name: string; colour: string; }>>({});
    const scheduleRef = useRef<HTMLDivElement>(null);

    const teamsQuery = useQuery({
        queryKey: ['teams', selectedLeague?.id],
        queryFn: () => getTeamsByLeague(selectedLeague!.id),
        enabled: !!selectedLeague,
        staleTime: 30 * 60 * 1000, // 30 minutes - teams rarely change
        gcTime: 60 * 60 * 1000, // 1 hour cache retention
    });

    const generateScheduleMutation = useMutation({
        mutationFn: generateSchedule,
        onSuccess: (schedule) => {
            setGeneratedSchedule(schedule);
            // Smooth scroll to the generated schedule after a brief delay
            setTimeout(() => {
                scheduleRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        },
        onError: (error) => {
            console.error('Failed to generate schedule:', error);
        }
    });

    const handleTeamToggle = (teamId: string) => {
        setSelectedTeams(prev =>
            prev.includes(teamId)
                ? prev.filter(id => id !== teamId)
                : [...prev, teamId]
        );
    };

    const handleSelectAll = () => {
        if (selectedTeams.length === teamsQuery.data?.length) {
            setSelectedTeams([]);
        } else {
            setSelectedTeams(teamsQuery.data?.map(team => team.id) || []);
        }
    };

    const handleGenerateSchedule = () => {
        const teams = teamsQuery.data || [];
        if (selectedTeams.length < 4) {
            alert('Need at least 4 teams to generate a schedule');
            return;
        }

        const names = teams.reduce((acc, team) => {
            acc[team.id] = team.name;
            return acc;
        }, {} as Record<string, string>);

        const teamDataMap = teams.reduce((acc, team) => {
            acc[team.id] = {
                id: team.id,
                name: team.name,
                colour: team.colour
            };
            return acc;
        }, {} as Record<string, { id: string; name: string; colour: string; }>);

        setTeamNames(names);
        setTeamData(teamDataMap);

        generateScheduleMutation.mutate({
            pods: selectedTeams,
            rounds,
            recencyWindow: 2,
            names,
            leagueId: selectedLeague?.id,
        });
    };

    if (!selectedLeague) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">
                    Please select a league to generate games.
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Schedule
            </Typography>

            {teamsQuery.isLoading && <CircularProgress />}
            {teamsQuery.isError && (
                <Alert severity="error">{String(teamsQuery.error)}</Alert>
            )}

            {teamsQuery.data && (
                <Section title="Select Teams for Pod Generation">

                    <Box sx={{ mb: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={handleSelectAll}
                            sx={{ mr: 2 }}
                        >
                            {selectedTeams.length === teamsQuery.data.length ? 'Deselect All' : 'Select All'}
                        </Button>
                        <Typography variant="body2" color="text.secondary">
                            {selectedTeams.length} of {teamsQuery.data.length} teams selected
                        </Typography>
                    </Box>

                    <Grid container spacing={1}>
                        {teamsQuery.data.map((team: TeamSummary) => (
                            <Grid key={team.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={selectedTeams.includes(team.id)}
                                            onChange={() => handleTeamToggle(team.id)}
                                        />
                                    }
                                    label={team.name}
                                />
                            </Grid>
                        ))}
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                            label="Number of Rounds"
                            type="number"
                            value={rounds}
                            onChange={(e) => setRounds(Number(e.target.value))}
                            inputProps={{ min: 1, max: 20 }}
                            sx={{ width: 200 }}
                        />

                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleGenerateSchedule}
                            disabled={generateScheduleMutation.isPending || selectedTeams.length < 4}
                        >
                            {generateScheduleMutation.isPending ? 'Generating...' : 'Generate Pods'}
                        </Button>
                    </Box>

                    {selectedTeams.length < 4 && selectedTeams.length > 0 && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            Select at least 4 teams to generate a schedule.
                        </Alert>
                    )}
                </Section>
            )}

            {generatedSchedule && (
                <Section
                    ref={scheduleRef}
                    title="Generated Schedule"
                    headerActions={
                        <Button variant="outlined" onClick={() => setGeneratedSchedule(null)}>
                            Clear Schedule
                        </Button>
                    }
                >

                    {generatedSchedule.rounds.filter(round => round.games.length > 0).map((round, roundIndex) => (
                        <Box key={roundIndex} sx={{ mb: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>Round {round.round}</Typography>
                            <Grid container spacing={2}>
                                {round.games.map((game, gameIndex) => (
                                    <Grid key={gameIndex} size={{ xs: 12, sm: 6, md: 4 }}>
                                        <GameCard
                                            game={game}
                                            homeTeamName={getTeamDisplayName(game.home, teamNames)}
                                            awayTeamName={getTeamDisplayName(game.away, teamNames)}
                                            homeTeamColor={getTeamColor(game.home, teamData)}
                                            awayTeamColor={getTeamColor(game.away, teamData)}
                                            onClick={() => {
                                                console.log('Game clicked:', game.gameId);
                                            }}
                                        />
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
                </Section>
            )}

            {teamsQuery.data?.length === 0 && (
                <Alert sx={{ mt: 2 }} severity="info">
                    No teams found for this league.
                </Alert>
            )}
        </Box>
    );
}