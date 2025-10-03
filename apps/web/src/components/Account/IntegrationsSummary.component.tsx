import { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Stack,
    Box,
    Button,
    Chip,
    CircularProgress,
} from '@mui/material';
import { Link as IntegrationIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getIntegrationConnections, getIntegrationProviders, type ApiIntegrationConnection, type IntegrationProvider } from '../../api/integrations';

export function IntegrationsSummary() {
    const navigate = useNavigate();
    const [connections, setConnections] = useState<ApiIntegrationConnection[]>([]);
    const [providers, setProviders] = useState<IntegrationProvider[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [connectionsData, providersData] = await Promise.all([
                getIntegrationConnections(),
                getIntegrationProviders()
            ]);
            setConnections(connectionsData);
            setProviders(providersData);
        } catch (err) {
            console.error('Failed to load integration data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getProviderInfo = (providerName: string) => {
        return providers.find(p => p.provider === providerName);
    };

    // Filter to only show connections that exist (connected or previously connected)
    const relevantConnections = connections.filter(conn => conn);

    if (loading) {
        return (
            <Paper sx={{ p: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <IntegrationIcon color="primary" />
                    <Typography variant="h6">
                        Data Integrations
                    </Typography>
                </Stack>
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <IntegrationIcon color="primary" />
                <Typography variant="h6">
                    Data Integrations
                </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                External services connected to sync your data
            </Typography>

            {relevantConnections.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                        No integrations configured
                    </Typography>
                </Box>
            ) : (
                <Stack spacing={2} sx={{ mb: 3 }}>
                    {relevantConnections.map((connection) => {
                        const provider = getProviderInfo(connection.provider);
                        return (
                            <Box
                                key={connection.provider}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    p: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                }}
                            >
                                {/* Provider Icon */}
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 0.5,
                                        bgcolor: provider?.primaryColor || '#666',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '0.875rem',
                                        mr: 2,
                                    }}
                                >
                                    {provider?.iconText || connection.provider.toUpperCase().slice(0, 2)}
                                </Box>

                                {/* Provider Name */}
                                <Typography variant="body1" sx={{ flexGrow: 1 }}>
                                    {provider?.name || connection.provider}
                                </Typography>

                                {/* Status */}
                                <Chip
                                    label={connection.isConnected ? 'Connected' : 'Disconnected'}
                                    color={connection.isConnected ? 'success' : 'default'}
                                    size="small"
                                    variant="outlined"
                                />
                            </Box>
                        );
                    })}
                </Stack>
            )}

            <Button
                variant="outlined"
                endIcon={<ChevronRightIcon />}
                onClick={() => navigate('/integrations')}
                fullWidth
            >
                {relevantConnections.length === 0 ? 'Set Up Integrations' : 'Manage Integrations'}
            </Button>
        </Paper>
    );
}