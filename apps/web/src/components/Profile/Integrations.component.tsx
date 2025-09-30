import {
    Paper,
    Typography,
    Stack,
    Card,
    CardContent,
    Box,
    Switch,
    FormControlLabel,
} from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';

export function Integrations() {
    return (
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
    );
}