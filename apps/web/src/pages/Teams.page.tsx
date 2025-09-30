import { useQuery } from '@tanstack/react-query';
import {
    Grid,
    CircularProgress,
} from '@mui/material';
import { getTeamsByLeague } from '../api/uc';
import { TeamSummary } from '../types/api';
import { useLeague } from '../hooks/useLeague';
import { TeamName } from '../components/TeamName.component';
import { Section } from '../components/Layout/Section.component';
import { Page } from '../components/Layout/Page.component';
import { PageAlert } from '../types/components';

export function Teams() {
    const { selectedLeague } = useLeague();

    const teamsQuery = useQuery({
        queryKey: ['teams', selectedLeague?.id],
        queryFn: () => getTeamsByLeague(selectedLeague!.id),
        enabled: !!selectedLeague,
        staleTime: 30 * 60 * 1000, // 30 minutes - teams rarely change
        gcTime: 60 * 60 * 1000, // 1 hour cache retention
    });

    // Build alerts array
    const alerts: PageAlert[] = [];

    if (!selectedLeague) {
        alerts.push({
            id: 'no-league',
            severity: 'info',
            message: 'Please select a league to view teams.',
        });
    }

    if (teamsQuery.isError) {
        alerts.push({
            id: 'query-error',
            severity: 'error',
            message: String(teamsQuery.error),
        });
    }

    if (teamsQuery.data?.length === 0 && !teamsQuery.isLoading) {
        alerts.push({
            id: 'no-teams',
            severity: 'info',
            message: 'No teams found for this league.',
        });
    }

    return (
        <Page
            title={selectedLeague ? `Teams in ${selectedLeague.name}` : 'Teams'}
            subtitle={selectedLeague ? `Browse teams in ${selectedLeague.name}` : undefined}
            alerts={alerts}
            meta={{
                title: `Teams - ${selectedLeague?.name || 'Ultiverse League'}`,
                description: selectedLeague
                    ? `View all teams in ${selectedLeague.name} league`
                    : 'View teams in your leagues',
            }}
            breadcrumbs={[
                { label: 'Home', href: '/' },
                { label: 'Teams' },
            ]}
        >
            {teamsQuery.isLoading && <CircularProgress />}

            {selectedLeague && teamsQuery.data && teamsQuery.data.length > 0 && (
                <Section>
                    <Grid container spacing={3}>
                        {teamsQuery.data.map((team: TeamSummary) => (
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
            )}
        </Page>
    );
}