import { Stack, Alert, Box, Typography } from '@mui/material';
import { Page } from '../components/Layout/Page.component';
import { ProfileHeader } from '../components/Profile/ProfileHeader.component';
import { AccountDetails } from '../components/Profile/AccountDetails.component';
import { Integrations } from '../components/Profile/Integrations.component';
import { PastTeamsHistory } from '../components/Profile/PastTeamsHistory.component';
import { ProfileActions } from '../components/Profile/ProfileActions.component';
import { useUser } from '../hooks/useUser';

export function ProfilePage() {
    const { user, isLoading } = useUser();

    // Get past teams from user data
    const pastTeams = user?.pastTeams || [];

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
                <ProfileHeader user={user} />
                <AccountDetails user={user} />
                <Integrations />
                <PastTeamsHistory pastTeams={pastTeams} isLoading={isLoading} />
                <ProfileActions />
            </Stack>
        </Page>
    );
}