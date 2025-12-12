import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Stack,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Skeleton,
    Alert,
} from '@mui/material';
import {
    Person as PersonIcon,
    EmojiEvents as CaptainIcon,
    SportsSoccer as CoachIcon,
} from '@mui/icons-material';
import { getTeamById, getTeamRoster } from '../api/uc';
import { Page } from '../components/Layout/Page.component';
import { Section } from '../components/Layout/Section.component';
import { SourceBadge } from '../components/SourceBadge.component';
import { JerseyIcon } from '../assets/jersey-icon';
import { DataSource } from '../types/api';

const roleIcons = {
    player: <PersonIcon fontSize="small" />,
    captain: <CaptainIcon fontSize="small" />,
    coach: <CoachIcon fontSize="small" />,
};

const roleLabels = {
    player: 'Player',
    captain: 'Captain',
    coach: 'Coach',
};

const getSourceFromJoinedVia = (joinedVia: string): { source: DataSource; provider?: 'ultimate_central' | 'zuluru' } | null => {
    if (joinedVia === 'manual') {
        return { source: 'ultiverse' };
    }
    if (joinedVia === 'uc_import') {
        return { source: 'ultimate_central', provider: 'ultimate_central' };
    }
    if (joinedVia === 'zuluru_import') {
        return { source: 'zuluru', provider: 'zuluru' };
    }
    return null;
};

export function TeamDetail() {
    const { teamId } = useParams<{ teamId: string }>();

    const teamQuery = useQuery({
        queryKey: ['team', teamId],
        queryFn: () => getTeamById(teamId!),
        enabled: !!teamId,
    });

    const rosterQuery = useQuery({
        queryKey: ['team-roster', teamId],
        queryFn: () => getTeamRoster(teamId!),
        enabled: !!teamId,
    });

    const team = teamQuery.data;
    const roster = rosterQuery.data || [];

    const isLoading = teamQuery.isLoading || rosterQuery.isLoading;
    const hasError = teamQuery.isError || rosterQuery.isError;

    return (
        <Page
            title={team?.name || 'Team Details'}
            subtitle={team?.division ? `Division: ${team.division}` : undefined}
            meta={{
                title: `${team?.name || 'Team'} - Ultiverse League`,
                description: `View roster and details for ${team?.name || 'team'}`,
            }}
            breadcrumbs={[
                { label: 'Home', href: '/' },
                { label: 'Teams', href: '/teams' },
                { label: team?.name || 'Loading...' },
            ]}
        >
            {hasError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    Failed to load team details. Please try again later.
                </Alert>
            )}

            {/* Team Info Card */}
            <Section>
                {isLoading ? (
                    <Stack spacing={2}>
                        <Skeleton variant="text" width="60%" height={40} />
                        <Skeleton variant="text" width="40%" height={24} />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Skeleton variant="rectangular" width={100} height={32} />
                            <Skeleton variant="rectangular" width={120} height={32} />
                        </Box>
                    </Stack>
                ) : (
                    <Stack spacing={3}>
                        {/* Team Header */}
                        <Stack direction="row" spacing={2} alignItems="center">
                            <JerseyIcon
                                color={team?.colour || '#666'}
                                sx={{ fontSize: 48 }}
                            />
                            <Box>
                                <Typography variant="h4" fontWeight={600}>
                                    {team?.name}
                                </Typography>
                                {team?.division && (
                                    <Typography variant="body1" color="text.secondary">
                                        {team.division}
                                    </Typography>
                                )}
                            </Box>
                        </Stack>

                        {/* Team Colors */}
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Typography variant="body2" color="text.secondary">
                                Team Colors:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 1,
                                        backgroundColor: team?.colour || '#666',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                    }}
                                />
                                {team?.altColour && (
                                    <Box
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 1,
                                            backgroundColor: team.altColour,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    />
                                )}
                            </Box>
                        </Stack>
                    </Stack>
                )}
            </Section>

            {/* Roster Section */}
            <Section>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                    Roster ({roster.length} {roster.length === 1 ? 'player' : 'players'})
                </Typography>

                {isLoading ? (
                    <Stack spacing={1}>
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} variant="rectangular" height={53} />
                        ))}
                    </Stack>
                ) : roster.length === 0 ? (
                    <Alert severity="info">
                        No players found for this team. Players will appear here after importing from Ultimate Central.
                    </Alert>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Joined Via</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {roster.map((player) => (
                                    <TableRow key={player.id} hover>
                                        <TableCell>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {roleIcons[player.role]}
                                                <Typography variant="body2">
                                                    {player.fullName || 'Unknown'}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {player.primaryEmail || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={roleLabels[player.role]}
                                                size="small"
                                                color={player.role === 'captain' ? 'primary' : 'default'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {(() => {
                                                const sourceInfo = getSourceFromJoinedVia(player.joinedVia);
                                                if (!sourceInfo) {
                                                    return (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {player.joinedVia}
                                                        </Typography>
                                                    );
                                                }
                                                return (
                                                    <SourceBadge
                                                        source={sourceInfo.source}
                                                        integrationProvider={sourceInfo.provider}
                                                        size="small"
                                                        showText={true}
                                                    />
                                                );
                                            })()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Section>
        </Page>
    );
}
