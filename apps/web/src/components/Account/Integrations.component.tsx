import {
    Stack,
    Typography,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    IconButton,
    Tooltip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    CircularProgress,
    Alert,
    Paper,
} from '@mui/material';
import {
    IntegrationInstructions as IntegrationInstructionsIcon,
    Link as LinkIcon,
    LinkOff as LinkOffIcon,
    Refresh as RefreshIcon,
    Error as ErrorIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useIntegrations } from '../../hooks/useIntegrations';
import { IntegrationProvider } from '../../api/integrations';
import { formatDistanceToNow } from 'date-fns';

export function Integrations() {
    const {
        availableIntegrations,
        isLoading: integrationsLoading,
        connectProvider,
        disconnectProvider,
        refreshConnection,
        isProviderConnected,
        getProviderConnection,
    } = useIntegrations();

    const handleConnect = async (provider: IntegrationProvider) => {
        try {
            await connectProvider(provider);
        } catch (error) {
            console.error('Failed to connect provider:', error);
        }
    };

    const handleDisconnect = async (provider: IntegrationProvider) => {
        try {
            await disconnectProvider(provider);
        } catch (error) {
            console.error('Failed to disconnect provider:', error);
        }
    };

    const handleRefresh = async (provider: IntegrationProvider) => {
        try {
            await refreshConnection(provider);
        } catch (error) {
            console.error('Failed to refresh connection:', error);
        }
    };

    const getStatusIcon = (provider: IntegrationProvider) => {
        const connection = getProviderConnection(provider);
        if (!connection) return <ErrorIcon color="error" />;

        switch (connection.status) {
            case 'connected':
                return <CheckCircleIcon color="success" />;
            case 'error':
                return <ErrorIcon color="error" />;
            case 'pending':
                return <CircularProgress size={20} />;
            default:
                return <LinkOffIcon color="disabled" />;
        }
    };

    const getStatusText = (provider: IntegrationProvider) => {
        const connection = getProviderConnection(provider);
        if (!connection) return 'Unknown';

        switch (connection.status) {
            case 'connected':
                return `Connected as ${connection.connectedEmail}`;
            case 'error':
                return connection.errorMessage || 'Connection error';
            case 'pending':
                return 'Connecting...';
            default:
                return 'Not connected';
        }
    };

    const getLastSyncText = (provider: IntegrationProvider) => {
        const connection = getProviderConnection(provider);
        if (!connection?.lastSyncAt) return 'Never synced';

        try {
            return `Last synced ${formatDistanceToNow(new Date(connection.lastSyncAt), { addSuffix: true })}`;
        } catch {
            return 'Invalid sync date';
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <IntegrationInstructionsIcon color="primary" />
                <Typography variant="h6">
                    Data Integrations
                </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Connect your account with external league management platforms to sync teams, games, and player data
            </Typography>

            <Stack spacing={3}>
                {availableIntegrations.map((integration) => {
                    const isConnected = isProviderConnected(integration);
                    const connection = getProviderConnection(integration);

                    return (
                        <Card key={integration.provider} variant="outlined">
                            <CardContent>
                                <Stack direction="row" spacing={3} alignItems="flex-start">
                                    {/* Provider Icon */}
                                    <Box
                                        sx={{
                                            width: 64,
                                            height: 64,
                                            borderRadius: 2,
                                            bgcolor: integration.primaryColor,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '1.4rem',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {integration.iconText}
                                    </Box>

                                    {/* Provider Info */}
                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                            <Typography variant="h6">
                                                {integration.name}
                                            </Typography>
                                            {getStatusIcon(integration)}
                                            {!integration.isAvailable && (
                                                <Chip label="Coming Soon" size="small" color="default" />
                                            )}
                                        </Stack>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {integration.description}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            <strong>Status:</strong> {getStatusText(integration)}
                                        </Typography>

                                        {isConnected && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {getLastSyncText(integration)}
                                            </Typography>
                                        )}

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                                Features:
                                            </Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                                {integration.features.map((feature) => (
                                                    <Chip
                                                        key={feature}
                                                        label={feature}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Stack>
                                        </Box>
                                    </Box>

                                    {/* Actions */}
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        {isConnected && (
                                            <Tooltip title="Refresh connection">
                                                <IconButton
                                                    onClick={() => handleRefresh(integration)}
                                                    disabled={integrationsLoading}
                                                >
                                                    <RefreshIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {integration.isAvailable ? (
                                            <Button
                                                variant={isConnected ? "outlined" : "contained"}
                                                color={isConnected ? "error" : "primary"}
                                                startIcon={isConnected ? <LinkOffIcon /> : <LinkIcon />}
                                                onClick={() => isConnected
                                                    ? handleDisconnect(integration)
                                                    : handleConnect(integration)
                                                }
                                                disabled={integrationsLoading || connection?.status === 'pending'}
                                            >
                                                {integrationsLoading && connection?.status === 'pending'
                                                    ? 'Connecting...'
                                                    : (isConnected ? 'Disconnect' : 'Connect')
                                                }
                                            </Button>
                                        ) : (
                                            <Button variant="outlined" disabled>
                                                Coming Soon
                                            </Button>
                                        )}
                                    </Stack>
                                </Stack>

                                {/* Connection Details */}
                                {isConnected && connection && (
                                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderTopColor: 'divider' }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                            Connection Details:
                                        </Typography>
                                        <List dense>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <CheckCircleIcon color="success" fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="Account"
                                                    secondary={connection.connectedEmail}
                                                />
                                            </ListItem>
                                            {connection.connectedAt && (
                                                <ListItem>
                                                    <ListItemIcon>
                                                        <ScheduleIcon color="action" fontSize="small" />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary="Connected"
                                                        secondary={formatDistanceToNow(new Date(connection.connectedAt), { addSuffix: true })}
                                                    />
                                                </ListItem>
                                            )}
                                        </List>
                                    </Box>
                                )}

                                {/* Error Details */}
                                {connection?.status === 'error' && connection.errorMessage && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        {connection.errorMessage}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </Stack>

            {/* Sync Information */}
            <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                    <strong>About Data Sync:</strong> All sync operations require explicit confirmation.
                    You can pull data from external platforms to Ultiverse or push your Ultiverse changes
                    back to external platforms. Conflicts are resolved manually with side-by-side comparison.
                </Typography>
            </Alert>
        </Paper>
    );
}