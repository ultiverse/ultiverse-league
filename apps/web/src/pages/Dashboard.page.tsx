import {
    Stack,
    Typography,
    Box,
    Button,
    Card,
    CardContent,
    Alert,
} from '@mui/material';
import {
    IntegrationInstructions as IntegrationInstructionsIcon,
    AccountBox as AccountBoxIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Page } from '../components/Layout/Page.component';
import { useLeague } from '../hooks/useLeague';
import { useIntegrations } from '../hooks/useIntegrations';

export function DashboardPage() {
    const navigate = useNavigate();
    const { selectedLeague } = useLeague();
    const { availableIntegrations, isProviderConnected } = useIntegrations();

    // Check if any integrations are connected
    const hasConnectedIntegrations = availableIntegrations.some(integration =>
        isProviderConnected(integration)
    );

    // If a league is selected and we're on the root path, redirect to teams
    // But allow /dashboard to show even with a league selected
    if (selectedLeague && window.location.pathname === '/') {
        navigate('/teams', { replace: true });
        return null;
    }

    const handleGoToAccount = () => {
        navigate('/account');
    };

    const handleSelectLeague = () => {
        navigate('/leagues');
    };

    return (
        <Page
            title="Welcome to Ultiverse League"
            subtitle="Your ultimate frisbee league management platform"
        >
            <Stack spacing={4} sx={{ maxWidth: 800, mx: 'auto' }}>
                {/* No League Selected Message */}
                <Alert severity="info">
                    <Typography variant="body2">
                        To get started, please select a league or connect your account with an external league management platform.
                    </Typography>
                </Alert>

                {/* Integration CTA - shown when no integrations are connected */}
                {!hasConnectedIntegrations && (
                    <Card variant="outlined" sx={{
                        border: '2px solid',
                        borderColor: 'primary.main',
                        bgcolor: 'primary.50'
                    }}>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <IntegrationInstructionsIcon
                                sx={{ fontSize: 64, color: 'primary.main', mb: 2 }}
                            />

                            <Typography variant="h5" gutterBottom fontWeight="bold">
                                Connect Your League Data
                            </Typography>

                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                                Connect your Ultiverse account with external league management platforms
                                like Ultimate Central to import your teams, games, and player data automatically.
                            </Typography>

                            <Stack direction="row" spacing={2} justifyContent="center">
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<IntegrationInstructionsIcon />}
                                    onClick={handleGoToAccount}
                                >
                                    Set Up Integrations
                                </Button>

                                <Button
                                    variant="outlined"
                                    size="large"
                                    startIcon={<AddIcon />}
                                    onClick={handleSelectLeague}
                                >
                                    Browse Leagues
                                </Button>
                            </Stack>

                            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                Integrations are managed in your Account settings
                            </Typography>
                        </CardContent>
                    </Card>
                )}

                {/* Connected but No League Selected */}
                {hasConnectedIntegrations && (
                    <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h5" gutterBottom>
                                Select a League
                            </Typography>

                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                You have integrations set up! Now select a league to start managing
                                your teams, schedules, and games.
                            </Typography>

                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<AddIcon />}
                                onClick={handleSelectLeague}
                            >
                                Choose League
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Quick Actions */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Card variant="outlined" sx={{ flex: 1 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <AccountBoxIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6">Account</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Manage your account settings, integrations, and security preferences.
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleGoToAccount}
                            >
                                Go to Account
                            </Button>
                        </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ flex: 1 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <IntegrationInstructionsIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6">Available Integrations</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {availableIntegrations.length} integration{availableIntegrations.length !== 1 ? 's' : ''} available including Ultimate Central and more.
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleGoToAccount}
                            >
                                View Integrations
                            </Button>
                        </CardContent>
                    </Card>
                </Stack>
            </Stack>
        </Page>
    );
}