import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Grid,
    CircularProgress,
    Button,
    Stack,
} from '@mui/material';
import { Download, CalendarMonth, Schedule } from '@mui/icons-material';
import { getTeamsByLeague, generateSchedule } from '../api/uc';
import { useLeague } from '../hooks/useLeague';
import { ScheduleView } from '@ultiverse/shared-types';
import { GameCard } from '../components/GameCard.component';
import { Section } from '../components/Layout/Section.component';
import { Page } from '../components/Layout/Page.component';
import { PageAlert } from '../types/components';
import { GenerateScheduleWizard } from '../components/GenerateScheduleWizard.component';
import { ConfirmationDialog } from '../components/ConfirmationDialog.component';
import { exportPodScheduleToCSV, exportPodScheduleToICS } from '../helpers/schedule.helper';
import { getTeamDisplayName, getTeamColor } from '../helpers/teams.helper';
import dayjs from 'dayjs';


export function Games() {
    const { selectedLeague } = useLeague();
    const [generatedSchedule, setGeneratedSchedule] = useState<ScheduleView | null>(null);
    const [teamNames, setTeamNames] = useState<Record<string, string>>({});
    const [teamData, setTeamData] = useState<Record<string, { id: string; name: string; colour: string; }>>({});
    const [venue, setVenue] = useState<string>('');
    const [fieldSlots, setFieldSlots] = useState<string[]>([]);
    const scheduleRef = useRef<HTMLDivElement>(null);

    // Wizard state
    const [wizardOpen, setWizardOpen] = useState(false);

    // Clear confirmation state
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

    const handleExportCSV = () => {
        if (!generatedSchedule) return;
        exportPodScheduleToCSV(generatedSchedule, teamNames, selectedLeague?.name, venue, fieldSlots);
    };

    const handleExportICS = () => {
        if (!generatedSchedule) return;
        exportPodScheduleToICS(generatedSchedule, teamNames, selectedLeague?.name, venue, fieldSlots);
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


    const handleGenerateSchedule = () => {
        setWizardOpen(true);
    };

    const handleCloseWizard = () => {
        setWizardOpen(false);
    };

    const handleClearScheduleClick = () => {
        setClearConfirmOpen(true);
    };

    const handleClearConfirm = () => {
        setGeneratedSchedule(null);
    };

    const handleClearCancel = () => {
        setClearConfirmOpen(false);
    };

    const handleWizardGenerate = async (scheduleData: {
        fieldSlot: { venue: string; dayOfWeek: number; startTime: unknown; duration: number; subfields: string[]; };
        range: { rangeMode: 'rounds' | 'endDate'; firstDate: unknown; numberOfRounds: number; endDate: unknown; blackoutDates: unknown[]; };
        pairing: { avoidRematches: boolean; balancePartners: boolean; balanceOpponents: boolean; };
    }) => {
        console.log('Generating schedule with data:', scheduleData);

        const { fieldSlot, range } = scheduleData;

        // Store venue and field slots for CSV export
        setVenue(fieldSlot.venue);
        setFieldSlots(fieldSlot.subfields);

        // Use all available teams from the league
        const selectedTeamIds = teamsQuery.data?.map(team => team.id) || [];

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

                teamsQuery.data.forEach((team) => {
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

    // Build alerts array
    const alerts: PageAlert[] = [];

    if (!selectedLeague) {
        alerts.push({
            id: 'no-league',
            severity: 'info',
            message: 'Please select a league to generate games.',
        });
    }

    if (generateScheduleMutation.isError) {
        alerts.push({
            id: 'generation-error',
            severity: 'error',
            message: `Failed to generate schedule: ${String(generateScheduleMutation.error)}`,
        });
    }

    if (teamsQuery.isError) {
        alerts.push({
            id: 'teams-error',
            severity: 'error',
            message: String(teamsQuery.error),
        });
    }

    if (teamsQuery.data?.length === 0 && !teamsQuery.isLoading && selectedLeague) {
        alerts.push({
            id: 'no-teams',
            severity: 'info',
            message: 'No teams found for this league.',
        });
    }

    // Build page actions
    const pageActions = (
        <Stack direction="row" spacing={1}>
            <Button
                variant="contained"
                startIcon={<Schedule />}
                onClick={handleGenerateSchedule}
                disabled={!selectedLeague}
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
        </Stack>
    );

    return (
        <Page
            title="Schedule"
            subtitle={selectedLeague ? `Manage schedule for ${selectedLeague.name}` : 'Generate and manage your league schedule'}
            actions={pageActions}
            alerts={alerts}
            meta={{
                title: `Schedule - ${selectedLeague?.name || 'Ultiverse League'}`,
                description: selectedLeague
                    ? `Generate and manage schedule for ${selectedLeague.name} league`
                    : 'Generate and manage your league schedules',
            }}
            breadcrumbs={[
                { label: 'Home', href: '/' },
                { label: 'Schedule' },
            ]}
        >

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

            {/* Loading State */}
            {(generatedSchedule && teamsQuery.isLoading) && <CircularProgress />}

            {/* Generated Schedule */}
            {generatedSchedule && selectedLeague && (
                <Section
                    ref={scheduleRef}
                    title="Generated Schedule"
                    headerActions={
                        <Button variant="outlined" onClick={handleClearScheduleClick}>
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
                                            venue={venue}
                                            fieldSlot={game.field || undefined}
                                            onClick={() => {
                                                console.log('Game clicked:', game.gameId);
                                            }}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    ))}
                </Section>
            )}

            {/* Generate Schedule Wizard */}
            <GenerateScheduleWizard
                open={wizardOpen}
                onClose={handleCloseWizard}
                onGenerate={handleWizardGenerate}
                availableTeams={teamsQuery.data || []}
            />

            {/* Clear Schedule Confirmation Dialog */}
            <ConfirmationDialog
                open={clearConfirmOpen}
                onClose={handleClearCancel}
                onConfirm={handleClearConfirm}
                title="Clear Schedule"
                message="Are you sure you want to clear the generated schedule? This action cannot be undone and you'll need to regenerate the schedule from scratch."
                confirmText="Clear Schedule"
                confirmColor="error"
            />
        </Page>
    );
}