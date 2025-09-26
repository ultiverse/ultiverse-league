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
    Stack,
    Divider,
} from '@mui/material';
import { Download, CalendarMonth, Schedule, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { getTeamsByLeague, generateSchedule, TeamSummary } from '@/api/uc';
import { useLeague } from '@/hooks/useLeague';
import { ScheduleView, TeamSide } from '@ultiverse/shared-types';
import { GameCard } from '@/components/GameCard';
import { Section } from '@/components/Section';
import { GenerateScheduleWizard } from '@/components/GenerateScheduleWizard';
import { exportPodScheduleToCSV } from '@/helpers/podScheduleCSV.helper';
import dayjs from 'dayjs';

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
    const [venue, setVenue] = useState<string>('');
    const scheduleRef = useRef<HTMLDivElement>(null);

    // Wizard state
    const [wizardOpen, setWizardOpen] = useState(false);

    const handleExportCSV = () => {
        if (!generatedSchedule) return;
        exportPodScheduleToCSV(generatedSchedule, teamNames, selectedLeague?.name, venue);
    };

    const handleExportICS = () => {
        if (!generatedSchedule) return;
        // TODO: Implement ICS export
        console.log('Export ICS');
    };

    const handleShiftRounds = (direction: 'forward' | 'backward') => {
        if (!generatedSchedule) return;
        // TODO: Implement round shifting
        console.log(`Shift rounds ${direction}`);
    };

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
        setWizardOpen(true);
    };

    const handleCloseWizard = () => {
        setWizardOpen(false);
    };

    const handleWizardGenerate = async (scheduleData: {
        fieldSlot: { venue: string; dayOfWeek: number; startTime: unknown; duration: number; subfields: string[]; };
        range: { rangeMode: 'rounds' | 'endDate'; firstDate: unknown; numberOfRounds: number; endDate: unknown; blackoutDates: unknown[]; };
        pairing: { avoidRematches: boolean; balancePartners: boolean; balanceOpponents: boolean; };
    }) => {
        console.log('Generating schedule with data:', scheduleData);

        const { fieldSlot, range } = scheduleData;

        // Store venue for CSV export
        setVenue(fieldSlot.venue);

        // Prepare the team IDs for the schedule generation
        const selectedTeamIds = selectedTeams.length > 0 ? selectedTeams : teamsQuery.data?.map(team => team.id) || [];

        // Calculate the number of rounds
        const numberOfRounds = range.rangeMode === 'rounds'
            ? range.numberOfRounds
            : Math.ceil(dayjs(range.endDate as string).diff(dayjs(range.firstDate as string), 'week', true));

        try {
            // Use the actual generateSchedule API
            const result = await generateScheduleMutation.mutateAsync({
                pods: selectedTeamIds,
                rounds: numberOfRounds
            });

            // Build team name and data mappings from the available teams
            if (teamsQuery.data) {
                const teamNameMap: Record<string, string> = {};
                const teamDataMap: Record<string, { id: string; name: string; colour: string; }> = {};

                teamsQuery.data.forEach((team: TeamSummary) => {
                    teamNameMap[team.id] = team.name;
                    teamDataMap[team.id] = {
                        id: team.id,
                        name: team.name,
                        colour: team.colour || '#000000'
                    };
                });

                setTeamNames(teamNameMap);
                setTeamData(teamDataMap);
            }

            setGeneratedSchedule(result);
        } catch (error) {
            console.error('Failed to generate schedule:', error);
        }
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
            {/* Admin Header */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
            }}>
                <Typography variant="h4">
                    Schedule
                </Typography>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="contained"
                        startIcon={<Schedule />}
                        onClick={handleGenerateSchedule}
                    >
                        Generate Schedule
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={handleExportCSV}
                        disabled={!generatedSchedule}
                    >
                        Export CSV
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<CalendarMonth />}
                        onClick={handleExportICS}
                        disabled={!generatedSchedule}
                    >
                        Export ICS
                    </Button>

                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                    <Button
                        variant="outlined"
                        startIcon={<ChevronLeft />}
                        onClick={() => handleShiftRounds('backward')}
                        disabled={!generatedSchedule}
                        size="small"
                    >
                        -1 Week
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<ChevronRight />}
                        onClick={() => handleShiftRounds('forward')}
                        disabled={!generatedSchedule}
                        size="small"
                    >
                        +1 Week
                    </Button>
                </Stack>
            </Box>

            {/* Empty State - No Rounds Yet */}
            {!generatedSchedule && (
                <Section>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        py: 8,
                        textAlign: 'center'
                    }}>
                        <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h5" gutterBottom>
                            No rounds yet
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
                            Use Generate Schedule to define your weekly slot and we'll fill in the rounds.
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<Schedule />}
                            onClick={handleGenerateSchedule}
                        >
                            Generate Schedule
                        </Button>
                    </Box>
                </Section>
            )}

            {/* Development/Legacy UI - will be replaced by Rounds View */}
            {generatedSchedule && teamsQuery.isLoading && <CircularProgress />}
            {generatedSchedule && teamsQuery.isError && (
                <Alert severity="error">{String(teamsQuery.error)}</Alert>
            )}

            {generatedSchedule && teamsQuery.data && (
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
                            slotProps={{ htmlInput: { min: 1, max: 20 } }}
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

            {/* Generate Schedule Wizard */}
            <GenerateScheduleWizard
                open={wizardOpen}
                onClose={handleCloseWizard}
                onGenerate={handleWizardGenerate}
                availableTeams={teamsQuery.data || []}
            />
        </Box>
    );
}