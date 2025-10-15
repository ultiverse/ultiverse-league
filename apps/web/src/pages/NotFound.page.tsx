import { Box, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Page } from '../components/Layout/Page.component';

export function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <Page title="">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    textAlign: 'center',
                    px: 2,
                }}
            >
                <Typography
                    variant="h1"
                    sx={{
                        fontSize: { xs: '4rem', sm: '6rem', md: '8rem' },
                        fontWeight: 700,
                        color: 'primary.main',
                        mb: 2,
                    }}
                >
                    404
                </Typography>

                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 600,
                        mb: 4,
                        fontSize: { xs: '1.5rem', sm: '2rem' },
                    }}
                >
                    Out of Bounds
                </Typography>

                <Stack direction="row" spacing={2}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/')}
                    >
                        Back to Home
                    </Button>
                    <Button
                        variant="outlined"
                        size="large"
                        onClick={() => navigate(-1)}
                    >
                        Go Back
                    </Button>
                </Stack>
            </Box>
        </Page>
    );
}
