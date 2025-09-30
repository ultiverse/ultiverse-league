import {
    Paper,
    Typography,
    Stack,
    Box,
    Divider,
} from '@mui/material';
import { VerifiedUser } from '@mui/icons-material';

interface AccountDetailsProps {
    user: {
        firstName?: string;
        lastName?: string;
        email?: string;
    };
}

export function AccountDetails({ user }: AccountDetailsProps) {
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
            </Stack>
        </Paper>
    );
}