import {
    Stack,
    Button,
} from '@mui/material';

export function ProfileActions() {
    return (
        <Stack direction="row" spacing={2}>
            <Button variant="outlined" disabled>
                Edit Profile
            </Button>
            <Button variant="outlined" color="error" disabled>
                Delete Account
            </Button>
        </Stack>
    );
}