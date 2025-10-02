import { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Stack,
    Card,
    CardContent,
    Box,
    Button,
    CircularProgress,
    Alert,
    Chip,
} from '@mui/material';
import {
    Link as LinkIcon,
    LinkOff as LinkOffIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';
import {
    getIntegrationProviders,
    getIntegrationConnections,
    connectIntegrationProvider,
    disconnectIntegrationProvider,
    type IntegrationProvider,
    type ApiIntegrationConnection
} from '../../api/integrations';
import { OAuthCredentialsComponent, type OAuthCredentials } from './OAuthCredentials.component';
import { UCIntegrationInstructions } from './UCIntegration.component';

export function IntegrationsManager() {
    const [providers, setProviders] = useState<IntegrationProvider[]>([]);
    const [connections, setConnections] = useState<ApiIntegrationConnection[]>([]);
    const [loading, setLoading] = useState(true);
    const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
    const [oauthDialogOpen, setOauthDialogOpen] = useState(false);
    const [currentProvider, setCurrentProvider] = useState<IntegrationProvider | null>(null);
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
            await connectProvider(provider);
        }
    };

    const handleOAuthConnect = async (credentials: OAuthCredentials) => {
        if (!currentProvider) return;

        await connectProvider(currentProvider, credentials);
        setOauthDialogOpen(false);
        setCurrentProvider(null);
    };

    const connectProvider = async (provider: IntegrationProvider, credentials?: OAuthCredentials) => {
        try {
            setConnectingProvider(provider.provider);
            setError(null);

            await connectIntegrationProvider(provider.provider, credentials);
            await loadIntegrations();
        } catch (err) {
            setError(`Failed to connect to ${provider.name}`);
            console.error('Failed to connect provider:', err);
            throw err; // Re-throw to let OAuth component handle it
        } finally {
            setConnectingProvider(null);
        }
    };

    const handleDisconnect = async (provider: IntegrationProvider) => {
        try {
            setConnectingProvider(provider.provider);
            setError(null);

            await disconnectIntegrationProvider(provider.provider);
            await loadIntegrations();
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

    const hasBeenConnected = (provider: IntegrationProvider): boolean => {
        return connections.some(conn => conn.provider === provider.provider);
    };

    const getConnection = (provider: IntegrationProvider): ApiIntegrationConnection | undefined => {
        return connections.find(conn => conn.provider === provider.provider);
    };

    // Filter to show only providers that are connected or have been connected in the past
    const relevantProviders = providers.filter(provider =>
        provider.isAvailable && (isConnected(provider) || hasBeenConnected(provider))
    );

    const getInstructions = (provider: IntegrationProvider) => {
        switch (provider.provider) {
            case 'uc':
                return <UCIntegrationInstructions />;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
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
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="h5" gutterBottom>
                            Connected Integrations
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage your connected external services and data sources
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {relevantProviders.length === 0 ? (
                        <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    No integrations configured
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Connect your first integration to sync data and enhance your experience.
                                </Typography>
                            </CardContent>
                        </Card>
                    ) : (
                        <Stack spacing={2}>
                            {relevantProviders.map((provider) => {
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
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                        <Typography variant="h6">
                                                            {provider.name}
                                                        </Typography>
                                                        {connected ? (
                                                            <Chip
                                                                label="Connected"
                                                                color="success"
                                                                size="small"
                                                                icon={<LinkIcon />}
                                                            />
                                                        ) : (
                                                            <Chip
                                                                label="Disconnected"
                                                                color="default"
                                                                size="small"
                                                                icon={<LinkOffIcon />}
                                                            />
                                                        )}
                                                    </Stack>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                        {provider.description}
                                                    </Typography>
                                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                                        {provider.features.map(feature => (
                                                            <Chip
                                                                key={feature}
                                                                label={feature}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        ))}
                                                    </Stack>
                                                    {connection?.connectedAt && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                            {connected ? 'Connected' : 'Last connected'} on {new Date(connection.connectedAt).toLocaleDateString()}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Stack spacing={1} alignItems="flex-end">
                                                    {connected ? (
                                                        <Button
                                                            size="small"
                                                            color="error"
                                                            startIcon={isConnecting ? <CircularProgress size={16} /> : <LinkOffIcon />}
                                                            onClick={() => handleDisconnect(provider)}
                                                            disabled={isConnecting}
                                                        >
                                                            Disconnect
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            startIcon={isConnecting ? <CircularProgress size={16} /> : <SettingsIcon />}
                                                            onClick={() => handleConnect(provider)}
                                                            disabled={isConnecting}
                                                        >
                                                            Reconnect
                                                        </Button>
                                                    )}
                                                </Stack>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </Stack>
                    )}

                    <Typography variant="caption" color="text.secondary">
                        More integrations coming soon. Only active or previously connected integrations are shown.
                    </Typography>
                </Stack>
            </Paper>

            {/* OAuth Credentials Dialog */}
            <OAuthCredentialsComponent
                open={oauthDialogOpen}
                onClose={() => setOauthDialogOpen(false)}
                onSubmit={handleOAuthConnect}
                providerName={currentProvider?.name || ''}
                instructions={currentProvider ? getInstructions(currentProvider) : null}
                loading={connectingProvider === currentProvider?.provider}
                error={error}
                showDomainField={currentProvider?.provider === 'uc'}
                domainLabel="API Domain"
                domainPlaceholder="e.g., https://maul.usetopscore.com"
            />
        </>
    );
}