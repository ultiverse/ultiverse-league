import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Box, Container, Typography, Card, CardActionArea, CardContent,
    Grid, CircularProgress, Alert, Button
} from '@mui/material';
import { getLeagues, getTeamsByLeague, UCEvent, UCTeam } from './api/uc';

export function App() {
    const [selectedLeague, setSelectedLeague] = useState<UCEvent | null>(null);

    const leaguesQ = useQuery({
        queryKey: ['leagues'],
        queryFn: getLeagues
    });

    const teamsQ = useQuery({
        queryKey: ['teams', selectedLeague?.id],
        queryFn: () => getTeamsByLeague(selectedLeague!.id),
        enabled: !!selectedLeague
    });
    console.log(1111, leaguesQ.data, teamsQ.data);
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                Ultiverse League Manager
            </Typography>

            {!selectedLeague && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Select a League
                    </Typography>
                    {leaguesQ.isLoading && <CircularProgress />}
                    {leaguesQ.isError && <Alert severity="error">{String(leaguesQ.error)}</Alert>}
                    <Grid container spacing={2}>
                        {(leaguesQ?.data.result ?? []).map((lg) => (
                            <Grid key={lg.id} size={{ xs: 12, sm: 6 }}>
                                <Card>
                                    <CardActionArea onClick={() => setSelectedLeague(lg)}>
                                        <CardContent>
                                            <Typography variant="subtitle1">{lg.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">ID: {lg.id}</Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {selectedLeague && (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                        <Button variant="outlined" onClick={() => setSelectedLeague(null)}>Back</Button>
                        <Typography variant="h6">Teams in: {selectedLeague.name}</Typography>
                    </Box>
                    {teamsQ.isLoading && <CircularProgress />}
                    {teamsQ.isError && <Alert severity="error">{String(teamsQ.error)}</Alert>}
                    <Grid container spacing={2}>
                        {(teamsQ.data ?? []).map((t: UCTeam) => (
                            <Grid key={t.id} size={{ xs: 12, sm: 6 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="subtitle1">{t.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">ID: {t.id}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                    {teamsQ.data?.length === 0 && (
                        <Alert sx={{ mt: 2 }} severity="info">No teams found for this league.</Alert>
                    )}
                </Box>
            )}
        </Container>
    );
}
