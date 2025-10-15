import { useState } from 'react';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Stack,
    Box,
    Link,
    TextField,
    Alert,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Help as HelpIcon,
    OpenInNew as OpenInNewIcon
} from '@mui/icons-material';

export function UCIntegrationInstructions() {
    const [domain, setDomain] = useState('');

    // Process domain to extract clean domain name
    const getCleanDomain = (inputDomain: string): string => {
        if (!inputDomain) return '';

        // Remove protocol if present (https://, http://)
        const cleanDomain = inputDomain.replace(/^https?:\/\//, '');

        return cleanDomain;
    };

    const cleanDomain = getCleanDomain(domain);
    const oauthUrl = cleanDomain ? `https://${cleanDomain}/u/oauth-key` : '';

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <HelpIcon fontSize="small" />
                    <Typography variant="body2">
                        How to get Ultimate Central OAuth credentials
                    </Typography>
                </Stack>
            </AccordionSummary>
            <AccordionDetails>
                <Stack spacing={2}>
                    <TextField
                        label="Your League Domain"
                        placeholder="e.g., https://maul.ca or maul.ca"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        helperText="Enter your league's website domain to expose more instructions"
                        fullWidth
                        size="small"
                    />

                    {domain ? (
                        <Stack spacing={2}>
                            <Typography variant="body2">
                                Follow these steps to create OAuth credentials for Ultimate Central:
                            </Typography>
                            <Box component="ol" sx={{ pl: 2, m: 0 }}>
                                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                    Visit your organization's OAuth key management page:
                                    <Box sx={{ mt: 1 }}>
                                        <Link
                                            href={oauthUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                textDecoration: 'none',
                                                '&:hover': { textDecoration: 'underline' }
                                            }}
                                        >
                                            {oauthUrl}
                                            <OpenInNewIcon fontSize="small" />
                                        </Link>
                                    </Box>
                                </Typography>
                                <Typography component="li" variant="body2" sx={{ mb: 2 }}>
                                    On the OAuth page, you'll see three fields. Copy the values as follows:
                                    <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                                        <Stack spacing={1}>
                                            <Typography variant="body2">
                                                <strong>Client ID [access_token]</strong> → Copy this value to our <em>"Client ID"</em> field
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Client Secret</strong> → Copy this value to our <em>"Client Secret"</em> field
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>API Domain</strong> → Copy this value to our <em>"API Domain"</em> field
                                            </Typography>
                                        </Stack>
                                    </Box>
                                </Typography>
                                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                    Paste the copied values into the form fields below
                                </Typography>
                                <Typography component="li" variant="body2">
                                    Click "Connect" to establish the integration
                                </Typography>
                            </Box>
                            <Alert severity="info" sx={{ mt: 2 }}>
                                <Typography variant="caption">
                                    Your credentials will be stored securely and used only to access your Ultimate Central data.
                                </Typography>
                            </Alert>
                        </Stack>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            Enter your Ultimate Central's league web address above to see detailed setup instructions
                        </Typography>
                    )}
                </Stack>
            </AccordionDetails>
        </Accordion>
    );
}