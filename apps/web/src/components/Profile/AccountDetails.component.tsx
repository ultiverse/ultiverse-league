import {
    Paper,
    Typography,
    Stack,
    Box,
    Divider,
    Button,
    CircularProgress,
} from '@mui/material';
import { VerifiedUser, Link as LinkIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { SourceBadge } from '../SourceBadge.component';
import { useIntegrations } from '../../hooks/useIntegrations';

interface AccountDetailsProps {
    user: {
        firstName?: string;
        lastName?: string;
        email?: string;
    };
}

export function AccountDetails({ user }: AccountDetailsProps) {
    const navigate = useNavigate();
    const { connections, isLoading: loadingConnections } = useIntegrations();

    const connectedCount = connections.filter(conn => conn.isConnected).length;

    return (
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
                <Divider />
                <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Connected Integrations
                        </Typography>
                        <Button
                            size="small"
                            startIcon={<SettingsIcon />}
                            onClick={() => navigate('/integrations')}
                        >
                            Manage
                        </Button>
                    </Stack>
                    {loadingConnections ? (
                        <CircularProgress size={16} />
                    ) : (
                        <Stack direction="row" spacing={1} alignItems="center">
                            {connectedCount > 0 ? (
                                <>
                                    <LinkIcon color="success" fontSize="small" />
                                    <Typography variant="body1">
                                        {connectedCount} service{connectedCount !== 1 ? 's' : ''} connected
                                    </Typography>
                                    <Stack direction="row" spacing={1}>
                                        {connections
                                            .filter(conn => conn.isConnected)
                                            .map(conn => (
                                                <SourceBadge
                                                    key={conn.provider.provider}
                                                    source={conn.provider.provider as any}
                                                    integrationProvider={conn.provider.provider as any}
                                                    size="small"
                                                    showText={true}
                                                />
                                            ))}
                                    </Stack>
                                </>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No integrations connected
                                </Typography>
                            )}
                        </Stack>
                    )}
                </Box>
            </Stack>
        </Paper>
    );
}