import {
    Box,
    Typography,
    Paper,
    Avatar,
    Stack,
    Divider,
    Card,
    CardContent,
    Switch,
    FormControlLabel,
    Button,
    Alert,
} from '@mui/material';
import {
    AccountCircle,
    VerifiedUser,
    Link as LinkIcon,
    Groups as GroupsIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { Page } from '../components/layout/Page.component';
import { TeamName } from '../components/TeamName.component';
import { SeasonChip } from '../components/SeasonChip.component';
import { useUser } from '../hooks/useUser';
import { getUserPastTeams } from '../api/uc';

export function ProfilePage() {
    const { user, isLoading } = useUser();

    // Fetch past teams data
    const pastTeamsQuery = useQuery({
        queryKey: ['user-past-teams'],
        queryFn: getUserPastTeams,
        enabled: !!user,
        staleTime: 15 * 60 * 1000, // 15 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });

    if (isLoading) {
        return (
            <Page title="Profile" loading>
                <Box sx={{ p: 3 }}>
                    <Typography>Loading profile...</Typography>
                </Box>
            </Page>
        );
    }

    if (!user) {
        return (
            <Page title="Profile">
                <Box sx={{ p: 3 }}>
                    <Alert severity="warning">
                        No user profile found. Please log in.
                    </Alert>
                </Box>
            </Page>
        );
    }

    return (
        <Page title="Profile" subtitle="Manage your account settings and integrations">
            <Stack spacing={3}>
                {/* Profile Information */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Profile Information
                    </Typography>
                    <Stack direction="row" spacing={3} alignItems="center">
                        <Avatar
                            src={user.avatarSmall}
                            sx={{ width: 80, height: 80 }}
                        >
                            {!user.avatarSmall && user ?
                                `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() :
                                <AccountCircle sx={{ fontSize: 60 }} />
                            }
                        </Avatar>
                        <Stack spacing={1}>
                            <Typography variant="h5">
                                {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {user.email}
                            </Typography>
                            {user.avatarSmall && (
                                <Typography variant="caption" color="text.secondary">
                                    Profile photo from Ultimate Central
                                </Typography>
                            )}
                        </Stack>
                    </Stack>
                </Paper>

                {/* Account Details */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Account Details
                    </Typography>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Full Name
                            </Typography>
                            <Typography variant="body1">
                                {user.firstName} {user.lastName}
                            </Typography>
                        </Box>
                        <Divider />
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Email Address
                            </Typography>
                            <Typography variant="body1">
                                {user.email}
                            </Typography>
                        </Box>
                        <Divider />
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Account Status
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <VerifiedUser color="success" fontSize="small" />
                                <Typography variant="body1" color="success.main">
                                    Active
                                </Typography>
                            </Stack>
                        </Box>
                    </Stack>
                </Paper>

                {/* Integrations */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Integrations
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Manage your connected services and integrations
                    </Typography>

                    <Card variant="outlined">
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                {/* Ultimate Central Logo/Icon */}
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 1,
                                        bgcolor: '#1976d2',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '1.2rem'
                                    }}
                                >
                                    UC
                                </Box>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6">
                                        Ultimate Central
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Your ultimate frisbee league management platform.
                                        Connected for profile information and league data.
                                    </Typography>
                                </Box>
                                <Stack alignItems="center" spacing={1}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <LinkIcon color="success" fontSize="small" />
                                        <Typography variant="body2" color="success.main">
                                            Connected
                                        </Typography>
                                    </Stack>
                                    <FormControlLabel
                                        control={<Switch checked disabled />}
                                        label=""
                                        sx={{ m: 0 }}
                                    />
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        More integrations coming soon
                    </Typography>
                </Paper>

                {/* Past Teams History */}
                <Paper sx={{ p: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <GroupsIcon color="primary" />
                        <Typography variant="h6">
                            Past Teams History
                        </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Your team participation history from Ultimate Central
                    </Typography>

                    {pastTeamsQuery.isLoading && (
                        <Alert severity="info">Loading teams history...</Alert>
                    )}

                    {pastTeamsQuery.isError && (
                        <Alert severity="error">
                            Failed to load teams history. Please try again later.
                        </Alert>
                    )}

                    {pastTeamsQuery.data && pastTeamsQuery.data.length === 0 && (
                        <Alert severity="info">
                            No past teams found. Join a league to see your team history here!
                        </Alert>
                    )}

                    {pastTeamsQuery.data && pastTeamsQuery.data.length > 0 && (
                        <Stack spacing={2}>
                            {pastTeamsQuery.data.map((team) => (
                                <Card key={team.id} variant="outlined">
                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Box sx={{ flexGrow: 1 }}>
                                                <TeamName
                                                    name={team.name}
                                                    primaryColor={team.colour || '#1976d2'}
                                                    size="md"
                                                />
                                            </Box>
                                            <SeasonChip dateStr={team.dateJoined} />
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    )}

                    {!pastTeamsQuery.data && !pastTeamsQuery.isLoading && !pastTeamsQuery.isError && (
                        <Typography variant="body2" color="text.secondary">
                            Connect to Ultimate Central to see your team history
                        </Typography>
                    )}
                </Paper>

                {/* Actions */}
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" disabled>
                        Edit Profile
                    </Button>
                    <Button variant="outlined" color="error" disabled>
                        Delete Account
                    </Button>
                </Stack>
            </Stack>
        </Page>
    );
}