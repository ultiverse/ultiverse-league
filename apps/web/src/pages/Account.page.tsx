import {
    Stack,
    Alert,
    Paper,
    Typography,
    Box,
    TextField,
    Button,
} from '@mui/material';
import {
    Email as EmailIcon,
    Security as SecurityIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { Page } from '../components/Layout/Page.component';
import { useUser } from '../hooks/useUser';
import { IntegrationsSummary } from '../components/Account/IntegrationsSummary.component';

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
                            Primary account email address
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
                            helperText="Password management coming soon"
                        />
                        <TextField
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            fullWidth
                            disabled
                            helperText="Password management coming soon"
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

                {/* Data Integrations */}
                <IntegrationsSummary />

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