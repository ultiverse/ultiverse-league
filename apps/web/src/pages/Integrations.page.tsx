import {
    Alert,
    Box,
    Typography,
    Stack,
    Card,
    CardContent,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    Tooltip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import {
    Link as LinkIcon,
    LinkOff as LinkOffIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { Page } from '../components/Layout/Page.component';
import { useIntegrations } from '../hooks/useIntegrations';
import { IntegrationProvider } from '../types/api';
import { PageAlert } from '../types/components';
import { formatDistanceToNow } from 'date-fns';

export function IntegrationsPage() {
    const {
        availableIntegrations,
        isLoading,
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

    // Build alerts array
    const alerts: PageAlert[] = [
        {
            id: 'integration-info',
            severity: 'info',
            message: 'Connect your Ultiverse account with external league management platforms to sync teams, games, and player data. All sync operations are explicit and require your confirmation.',
        },
    ];

    return (
        <Page
            title="Integrations"
            subtitle="Connect and manage your external services and data sources"
            alerts={alerts}
        >
            <Stack spacing={4}>

                <Box>
                    <Typography variant="h6" gutterBottom>
                        Available Integrations
                    </Typography>
                    <Stack spacing={3}>
                        {availableIntegrations.map((integration) => {
                            const isConnected = isProviderConnected(integration.provider);
                            const connection = getProviderConnection(integration.provider);

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
                                                    {getStatusIcon(integration.provider)}
                                                    {!integration.isAvailable && (
                                                        <Chip label="Coming Soon" size="small" color="default" />
                                                    )}
                                                </Stack>

                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    {integration.description}
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    <strong>Status:</strong> {getStatusText(integration.provider)}
                                                </Typography>

                                                {isConnected && (
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                        {getLastSyncText(integration.provider)}
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
                                                            onClick={() => handleRefresh(integration.provider)}
                                                            disabled={isLoading}
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
                                                            ? handleDisconnect(integration.provider)
                                                            : handleConnect(integration.provider)
                                                        }
                                                        disabled={isLoading || connection?.status === 'pending'}
                                                    >
                                                        {isLoading && connection?.status === 'pending'
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
                </Box>

                <Box>
                    <Typography variant="h6" gutterBottom>
                        Sync & Data Management
                    </Typography>
                    <Alert severity="warning">
                        <Typography variant="body2">
                            <strong>Data Sync Workflow:</strong>
                        </Typography>
                        <List dense sx={{ mt: 1 }}>
                            <ListItem>
                                <ListItemText primary="• Pull data: Import changes from external platforms to Ultiverse" />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="• Push data: Send your Ultiverse changes back to external platforms" />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="• All sync operations require explicit confirmation" />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="• Conflicts are resolved manually with side-by-side comparison" />
                            </ListItem>
                        </List>
                    </Alert>
                </Box>
            </Stack>
        </Page>
    );
}