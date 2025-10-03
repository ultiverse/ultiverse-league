import { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Stack,
    Card,
    CardContent,
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Link,
} from '@mui/material';
import {
    Link as LinkIcon,
    LinkOff as LinkOffIcon,
    Settings as SettingsIcon,
    ExpandMore as ExpandMoreIcon,
    Help as HelpIcon
} from '@mui/icons-material';
import {
    getIntegrationProviders,
    getIntegrationConnections,
    connectIntegrationProvider,
    disconnectIntegrationProvider,
    type IntegrationProvider,
    type ApiIntegrationConnection
} from '../../api/integrations';

interface OAuthCredentials {
    clientId: string;
    clientSecret: string;
}

export function Integrations() {
    const [providers, setProviders] = useState<IntegrationProvider[]>([]);
    const [connections, setConnections] = useState<ApiIntegrationConnection[]>([]);
    const [loading, setLoading] = useState(true);
    const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
    const [oauthDialogOpen, setOauthDialogOpen] = useState(false);
    const [currentProvider, setCurrentProvider] = useState<IntegrationProvider | null>(null);
    const [oauthCredentials, setOauthCredentials] = useState<OAuthCredentials>({ clientId: '', clientSecret: '' });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadIntegrations();
    }, []);

    const loadIntegrations = async () => {
        try {
            setLoading(true);
            const [providersData, connectionsData] = await Promise.all([
                getIntegrationProviders(),
                getIntegrationConnections()
            ]);
            setProviders(providersData);
            setConnections(connectionsData);
        } catch (err) {
            setError('Failed to load integrations');
            console.error('Failed to load integrations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (provider: IntegrationProvider) => {
        if (provider.authType === 'oauth') {
            setCurrentProvider(provider);
            setOauthDialogOpen(true);
        } else {
            // Handle other auth types if needed
            await connectProvider(provider);
        }
    };

    const handleOAuthConnect = async () => {
        if (!currentProvider || !oauthCredentials.clientId || !oauthCredentials.clientSecret) {
            setError('Please provide both Client ID and Client Secret');
            return;
        }

        await connectProvider(currentProvider, oauthCredentials);
        setOauthDialogOpen(false);
        setOauthCredentials({ clientId: '', clientSecret: '' });
        setCurrentProvider(null);
    };

    const connectProvider = async (provider: IntegrationProvider, credentials?: OAuthCredentials) => {
        try {
            setConnectingProvider(provider.provider);
            setError(null);

            await connectIntegrationProvider(provider.provider, credentials);
            await loadIntegrations(); // Refresh connections
        } catch (err) {
            setError(`Failed to connect to ${provider.name}`);
            console.error('Failed to connect provider:', err);
        } finally {
            setConnectingProvider(null);
        }
    };

    const handleDisconnect = async (provider: IntegrationProvider) => {
        try {
            setConnectingProvider(provider.provider);
            setError(null);

            await disconnectIntegrationProvider(provider.provider);
            await loadIntegrations(); // Refresh connections
        } catch (err) {
            setError(`Failed to disconnect from ${provider.name}`);
            console.error('Failed to disconnect provider:', err);
        } finally {
            setConnectingProvider(null);
        }
    };

    const isConnected = (provider: IntegrationProvider): boolean => {
        return connections.some(conn => conn.provider === provider.provider && conn.isConnected);
    };

    const getConnection = (provider: IntegrationProvider): ApiIntegrationConnection | undefined => {
        return connections.find(conn => conn.provider === provider.provider);
    };

    if (loading) {
        return (
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Integrations
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress />
                </Box>
            </Paper>
        );
    }

    return (
        <>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Integrations
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Manage your connected services and integrations
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Stack spacing={2}>
                    {providers.map((provider) => {
                        const connection = getConnection(provider);
                        const connected = isConnected(provider);
                        const isConnecting = connectingProvider === provider.provider;

                        return (
                            <Card key={provider.provider} variant="outlined">
                                <CardContent>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 1,
                                                bgcolor: provider.primaryColor,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '1.2rem'
                                            }}
                                        >
                                            {provider.iconText}
                                        </Box>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6">
                                                {provider.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {provider.description}
                                            </Typography>
                                            {connection?.connectedAt && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Connected on {new Date(connection.connectedAt).toLocaleDateString()}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Stack alignItems="center" spacing={1}>
                                            {connected ? (
                                                <>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <LinkIcon color="success" fontSize="small" />
                                                        <Typography variant="body2" color="success.main">
                                                            Connected
                                                        </Typography>
                                                    </Stack>
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        startIcon={isConnecting ? <CircularProgress size={16} /> : <LinkOffIcon />}
                                                        onClick={() => handleDisconnect(provider)}
                                                        disabled={isConnecting || !provider.isAvailable}
                                                    >
                                                        Disconnect
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <LinkOffIcon color="disabled" fontSize="small" />
                                                        <Typography variant="body2" color="text.secondary">
                                                            Not connected
                                                        </Typography>
                                                    </Stack>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        startIcon={isConnecting ? <CircularProgress size={16} /> : <SettingsIcon />}
                                                        onClick={() => handleConnect(provider)}
                                                        disabled={isConnecting || !provider.isAvailable}
                                                    >
                                                        {provider.isAvailable ? 'Connect' : 'Coming Soon'}
                                                    </Button>
                                                </>
                                            )}
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Stack>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    More integrations coming soon
                </Typography>
            </Paper>

            {/* OAuth Credentials Dialog */}
            <Dialog open={oauthDialogOpen} onClose={() => setOauthDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Connect to {currentProvider?.name}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        To connect to {currentProvider?.name}, you'll need to provide your OAuth credentials.
                    </Typography>

                    {currentProvider?.provider === 'uc' && (
                        <Accordion sx={{ mb: 2 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <HelpIcon fontSize="small" />
                                    <Typography variant="body2">
                                        How to get Ultimate Central OAuth credentials
                                    </Typography>
                                </Stack>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <Typography variant="body2">
                                        Follow these steps to create OAuth credentials for Ultimate Central:
                                    </Typography>
                                    <Box component="ol" sx={{ pl: 2, m: 0 }}>
                                        <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                            Visit the Ultimate Central developer portal at{' '}
                                            <Link
                                                href="https://maul.usetopscore.com/api/help?endpoint=%2Fapi%2Foauth%2Fserver"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                UC API Documentation
                                            </Link>
                                        </Typography>
                                        <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                            Register a new OAuth application with these settings:
                                            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                                                <Typography component="li" variant="caption">Application Type: Web Application</Typography>
                                                <Typography component="li" variant="caption">Redirect URI: {window.location.origin}/integrations/callback</Typography>
                                            </Box>
                                        </Typography>
                                        <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                            Copy the generated Client ID and Client Secret
                                        </Typography>
                                        <Typography component="li" variant="body2">
                                            Paste them in the fields below
                                        </Typography>
                                    </Box>
                                </Stack>
                            </AccordionDetails>
                        </Accordion>
                    )}

                    <TextField
                        autoFocus
                        margin="dense"
                        label="Client ID"
                        fullWidth
                        variant="outlined"
                        value={oauthCredentials.clientId}
                        onChange={(e) => setOauthCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                        sx={{ mb: 2 }}
                        helperText="The Client ID from your OAuth application"
                    />

                    <TextField
                        margin="dense"
                        label="Client Secret"
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={oauthCredentials.clientSecret}
                        onChange={(e) => setOauthCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                        helperText="The Client Secret from your OAuth application (keep this secure)"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOauthDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleOAuthConnect}
                        variant="contained"
                        disabled={!oauthCredentials.clientId || !oauthCredentials.clientSecret}
                    >
                        Connect
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}