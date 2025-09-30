import {
    Paper,
    Typography,
    Stack,
    Box,
    Button,
    Chip,
    Alert,
} from '@mui/material';
import {
    Settings as SettingsIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useIntegrations } from '../../hooks/useIntegrations';

export function IntegrationsOverview() {
    const { connections, availableIntegrations } = useIntegrations();

    const connectedCount = connections.filter(conn => conn.isConnected).length;
    const availableCount = availableIntegrations.filter(integration => integration.isAvailable).length;

    const getConnectionSummary = () => {
        if (connectedCount === 0) {
            return {
                message: 'No integrations connected',
                severity: 'warning' as const,
                icon: <ErrorIcon color="warning" />
            };
        }

        return {
            message: `${connectedCount} of ${availableCount} integration${availableCount === 1 ? '' : 's'} connected`,
            severity: 'success' as const,
            icon: <CheckCircleIcon color="success" />
        };
    };

    const summary = getConnectionSummary();

    return (
        <Paper sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Integrations
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Connected external services and data sources
                    </Typography>
                </Box>
                <Button
                    component={Link}
                    to="/integrations"
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    size="small"
                >
                    Manage
                </Button>
            </Stack>

            <Alert
                severity={summary.severity}
                icon={summary.icon}
                sx={{ mb: 2 }}
            >
                {summary.message}
            </Alert>

            <Stack spacing={2}>
                {connections.map((connection) => {
                    const integration = availableIntegrations.find(i => i.provider === connection.provider);
                    if (!integration) return null;

                    return (
                        <Box key={connection.provider}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 1,
                                        bgcolor: integration.primaryColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    {integration.iconText}
                                </Box>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2" fontWeight="medium">
                                        {integration.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {connection.isConnected
                                            ? `Connected as ${connection.connectedEmail}`
                                            : 'Not connected'
                                        }
                                    </Typography>
                                </Box>
                                <Chip
                                    label={connection.isConnected ? 'Connected' : 'Disconnected'}
                                    size="small"
                                    color={connection.isConnected ? 'success' : 'default'}
                                    variant="outlined"
                                />
                            </Stack>
                        </Box>
                    );
                })}
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Manage all integration settings and sync preferences in the dedicated Integrations page.
            </Typography>
        </Paper>
    );
}