import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Typography,
    Stack,
    Alert,
} from '@mui/material';

export interface OAuthCredentials {
    clientId: string;
    clientSecret: string;
    domain?: string;
}

interface OAuthCredentialsProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (credentials: OAuthCredentials) => Promise<void>;
    providerName: string;
    instructions?: React.ReactNode;
    loading?: boolean;
    error?: string | null;
    showDomainField?: boolean;
    domainLabel?: string;
    domainPlaceholder?: string;
}

export function OAuthCredentialsComponent({
    open,
    onClose,
    onSubmit,
    providerName,
    instructions,
    loading = false,
    error = null,
    showDomainField = false,
    domainLabel = "Domain",
    domainPlaceholder = "Enter domain"
}: OAuthCredentialsProps) {
    const [credentials, setCredentials] = useState<OAuthCredentials>({
        clientId: '',
        clientSecret: '',
        domain: ''
    });
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!credentials.clientId || !credentials.clientSecret) {
            setLocalError('Please provide both Client ID and Client Secret');
            return;
        }

        try {
            setLocalError(null);
            await onSubmit(credentials);
            // Reset form on success
            setCredentials({ clientId: '', clientSecret: '' });
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : 'Connection failed');
        }
    };

    const handleClose = () => {
        setCredentials({ clientId: '', clientSecret: '', domain: '' });
        setLocalError(null);
        onClose();
    };

    const displayError = error || localError;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Connect to {providerName}
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                        To connect to {providerName}, you'll need to provide your OAuth credentials.
                    </Typography>

                    {instructions}

                    {displayError && (
                        <Alert severity="error" onClose={() => setLocalError(null)}>
                            {displayError}
                        </Alert>
                    )}

                    {showDomainField && (
                        <TextField
                            label={domainLabel}
                            placeholder={domainPlaceholder}
                            fullWidth
                            variant="outlined"
                            value={credentials.domain}
                            onChange={(e) => setCredentials(prev => ({ ...prev, domain: e.target.value }))}
                            helperText="The domain for your organization"
                            disabled={loading}
                        />
                    )}

                    <TextField
                        autoFocus={!showDomainField}
                        label="Client ID"
                        fullWidth
                        variant="outlined"
                        value={credentials.clientId}
                        onChange={(e) => setCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                        helperText="The Client ID from your OAuth application"
                        disabled={loading}
                    />

                    <TextField
                        label="Client Secret"
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={credentials.clientSecret}
                        onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                        helperText="The Client Secret from your OAuth application (keep this secure)"
                        disabled={loading}
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || !credentials.clientId || !credentials.clientSecret}
                >
                    {loading ? 'Connecting...' : 'Connect'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}