import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Grid,
    CircularProgress,
    Alert,
} from '@mui/material';
import { getTeamsByLeague, TeamSummary } from '@/api/uc';
import { useLeague } from '@/hooks/useLeague';
import { TeamName } from '@/components/TeamName';
import { Section } from '@/components/Section';

export function Teams() {
    const { selectedLeague } = useLeague();

    const teamsQuery = useQuery({
        queryKey: ['teams', selectedLeague?.id],
        queryFn: () => getTeamsByLeague(selectedLeague!.id),
        enabled: !!selectedLeague
    });

    if (!selectedLeague) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">
                    Please select a league to view teams.
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: 'var(--mui-palette-background-default)', minHeight: '100vh', p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Teams in {selectedLeague.name}
            </Typography>

            {teamsQuery.isLoading && <CircularProgress />}
            {teamsQuery.isError && (
                <Alert severity="error">{String(teamsQuery.error)}</Alert>
            )}

            <Section>
                <Grid container spacing={3}>
                    {(teamsQuery.data ?? []).map((team: TeamSummary) => (
                        <Grid key={team.id} size={{ xs: 12, sm: 6, md: 4 }}>
                            <TeamName
                                name={team.name}
                                primaryColor={team.colour}
                                onClick={() => {
                                    // Future: Navigate to team detail page
                                    console.log('Team clicked:', team.name);
                                }}
                                variant="inline"
                            />
                        </Grid>
                    ))}
                </Grid>
            </Section>

            {teamsQuery.data?.length === 0 && (
                <Alert sx={{ mt: 2 }} severity="info">
                    No teams found for this league.
                </Alert>
            )}
        </Box>
    );
}