import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Grid,
    Skeleton,
    Card,
    CardContent,
    Box,
    Button,
    CircularProgress,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { getTeamsByLeague } from '../api/uc';
import { TeamSummary } from '../types/api';
import { useLeague } from '../hooks/useLeague';
import { TeamCard } from '../components/TeamCard.component';
import { Section } from '../components/Layout/Section.component';
import { Page } from '../components/Layout/Page.component';
import { PageAlert } from '../types/components';

// Skeleton loading component for team cards
function TeamCardSkeleton() {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="text" width={80} height={20} />
                </Box>
                <Skeleton variant="text" width="80%" height={32} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                    <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                </Box>
            </CardContent>
        </Card>
    );
}

export function Teams() {
    const { selectedLeague } = useLeague();
    const [isSyncing, setIsSyncing] = useState(false);
    const navigate = useNavigate();

    const teamsQuery = useQuery({
        queryKey: ['teams', selectedLeague?.id],
        queryFn: async () => {
            return await getTeamsByLeague(selectedLeague!.id);
        },
        enabled: !!selectedLeague,
        staleTime: 30 * 60 * 1000, // 30 minutes - teams rarely change
        gcTime: 60 * 60 * 1000, // 1 hour cache retention
        refetchInterval: (query) => {
            // If no teams found, poll every 3 seconds to check if import completed
            // The API auto-triggers import when no teams are found
            return query.state.data && query.state.data.length === 0 ? 3000 : false;
        },
    });

    const handleForceSync = async () => {
        if (!selectedLeague) return;

        setIsSyncing(true);
        try {
            const response = await fetch(`/api/v1/leagues/${selectedLeague.id}/refresh?force=true`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to sync league data');
            }

            // Wait a moment for the sync to start, then refetch teams
            setTimeout(() => {
                teamsQuery.refetch();
                setIsSyncing(false);
            }, 2000);
        } catch (error) {
            console.error('Failed to force sync:', error);
            setIsSyncing(false);
        }
    };

    // Stop polling after 30 seconds to avoid infinite loops
    useEffect(() => {
        if (teamsQuery.data?.length === 0 && !teamsQuery.isLoading) {
            const timeout = setTimeout(() => {
                // This will cause refetchInterval to return false
                teamsQuery.refetch();
            }, 30000);

            return () => clearTimeout(timeout);
        }
    }, [teamsQuery]);

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
            {/* Force Sync Button */}
            {selectedLeague && (
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="outlined"
                        startIcon={isSyncing ? <CircularProgress size={16} /> : <RefreshIcon />}
                        onClick={handleForceSync}
                        disabled={isSyncing || teamsQuery.isLoading}
                    >
                        {isSyncing ? 'Syncing...' : 'Force Sync'}
                    </Button>
                </Box>
            )}

            {/* Show skeleton cards while loading */}
            {teamsQuery.isLoading && selectedLeague && (
                <Section>
                    <Grid container spacing={3}>
                        {[...Array(6)].map((_, index) => (
                            <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                                <TeamCardSkeleton />
                            </Grid>
                        ))}
                    </Grid>
                </Section>
            )}

            {/* Show teams when loaded successfully */}
            {!teamsQuery.isLoading && selectedLeague && teamsQuery.data && teamsQuery.data.length > 0 && (
                <Section>
                    <Grid container spacing={3}>
                        {teamsQuery.data.map((team: TeamSummary) => (
                            <Grid key={team.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <TeamCard
                                    team={team}
                                    onClick={(clickedTeam) => {
                                        navigate(`/teams/${clickedTeam.id}`);
                                    }}
                                    showSourceInfo={true}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Section>
            )}
        </Page>
    );
}