import {
    Paper,
    Avatar,
    Stack,
    Typography,
} from '@mui/material';
import { AccountCircle } from '@mui/icons-material';

interface ProfileHeaderProps {
    user: {
        firstName?: string;
        lastName?: string;
        email?: string;
        avatarSmall?: string;
    };
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Profile Information
            </Typography>
            <Stack direction="row" spacing={3} alignItems="center">
                <Avatar
                    src={user.avatarSmall}
                    sx={{ width: 80, height: 80 }}
                >
                    {!user.avatarSmall && user ?
                        `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() :
                        <AccountCircle sx={{ fontSize: 60 }} />
                    }
                </Avatar>
                <Stack spacing={1}>
                    <Typography variant="h5">
                        {user.firstName} {user.lastName}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {user.email}
                    </Typography>
                    {user.avatarSmall && (
                        <Typography variant="caption" color="text.secondary">
                            Profile photo from Ultimate Central
                        </Typography>
                    )}
                </Stack>
            </Stack>
        </Paper>
    );
}