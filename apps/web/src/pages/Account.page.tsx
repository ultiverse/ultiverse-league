import {
    Stack,
    Alert,
    Paper,
    Typography,
    Box,
    TextField,
    Button,
    Card,
    CardContent,
    Chip,
} from '@mui/material';
import {
    Email as EmailIcon,
    Security as SecurityIcon,
    Login as LoginIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { Page } from '../components/Layout/Page.component';
import { useUser } from '../hooks/useUser';
import { Integrations } from '../components/Account/Integrations.component';

export function AccountPage() {
    const { user, isLoading } = useUser();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    if (isLoading) {
        return (
            <Page title="Account" loading>
                <Box sx={{ p: 3 }}>
                    <Typography>Loading account information...</Typography>
                </Box>
            </Page>
        );
    }

    if (!user) {
        return (
            <Page title="Account">
                <Box sx={{ p: 3 }}>
                    <Alert severity="warning">
                        No account information found. Please log in.
                    </Alert>
                </Box>
            </Page>
        );
    }

    const handlePasswordReset = () => {
        if (newPassword !== confirmPassword) {
            // Handle password mismatch
            return;
        }
        // TODO: Implement password reset logic
        console.log('Password reset requested');
    };


    return (
        <Page title="Account" subtitle="Manage your account security and login methods">
            <Stack spacing={3}>
                {/* Account Email */}
                <Paper sx={{ p: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <EmailIcon color="primary" />
                        <Typography variant="h6">
                            Account Email
                        </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Your primary account email address
                    </Typography>

                    <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                            Email Address
                        </Typography>
                        <Typography variant="h6" sx={{ mt: 1 }}>
                            {user.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Verified via Ultimate Central integration
                        </Typography>
                    </Box>
                </Paper>

                {/* Password Reset */}
                <Paper sx={{ p: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <SecurityIcon color="primary" />
                        <Typography variant="h6">
                            Password & Security
                        </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Update your password to keep your account secure
                    </Typography>

                    <Stack spacing={2} sx={{ maxWidth: 400 }}>
                        <TextField
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            fullWidth
                            disabled
                            helperText="Password management is handled through Ultimate Central"
                        />
                        <TextField
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            fullWidth
                            disabled
                            helperText="Use Ultimate Central to change your password"
                        />
                        <Button
                            variant="outlined"
                            onClick={handlePasswordReset}
                            disabled
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            Update Password
                        </Button>
                    </Stack>
                </Paper>

                {/* Login Integrations */}
                <Paper sx={{ p: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <LoginIcon color="primary" />
                        <Typography variant="h6">
                            Login Methods
                        </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Connected services you can use to log in to your account
                    </Typography>

                    <Stack spacing={2}>
                        {/* Ultimate Central Integration */}
                        <Card variant="outlined">
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    {/* Ultimate Central Logo/Icon */}
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 1,
                                            bgcolor: '#1976d2',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        UC
                                    </Box>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="subtitle1" fontWeight="medium">
                                            Ultimate Central
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Primary authentication method for ultimate frisbee leagues
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <CheckCircleIcon color="success" fontSize="small" />
                                        <Chip
                                            label="Active"
                                            color="success"
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Future Integration Placeholder */}
                        <Box sx={{ p: 2, border: '2px dashed', borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                Additional login methods will be available in the future
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>

                {/* Data Integrations */}
                <Integrations />

                {/* Account Actions */}
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" disabled>
                        Export Account Data
                    </Button>
                    <Button variant="outlined" color="error" disabled>
                        Delete Account
                    </Button>
                </Stack>
            </Stack>
        </Page>
    );
}