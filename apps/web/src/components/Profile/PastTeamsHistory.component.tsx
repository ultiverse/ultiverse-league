import { useState } from 'react';
import {
    Paper,
    Typography,
    Stack,
    Card,
    CardContent,
    Box,
    Alert,
    Pagination,
    Grid,
} from '@mui/material';
import { Groups as GroupsIcon } from '@mui/icons-material';
import { TeamName } from '../TeamName.component';
import { SeasonChip } from '../SeasonChip.component';

const TEAMS_PER_PAGE = 6; // Better for 2-column layout (3 rows × 2 columns)

interface PastTeam {
    id: string;
    name: string;
    colour?: string;
    dateJoined?: string;
}

interface PastTeamsHistoryProps {
    pastTeams: PastTeam[];
    isLoading: boolean;
}

export function PastTeamsHistory({ pastTeams, isLoading }: PastTeamsHistoryProps) {
    const [currentPage, setCurrentPage] = useState(1);

    // Pagination calculations
    const totalPages = Math.ceil(pastTeams.length / TEAMS_PER_PAGE);
    const startIndex = (currentPage - 1) * TEAMS_PER_PAGE;
    const endIndex = startIndex + TEAMS_PER_PAGE;
    const currentTeams = pastTeams.slice(startIndex, endIndex);

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <GroupsIcon color="primary" />
                <Typography variant="h6">
                    Past Teams History
                </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your team participation history from Ultimate Central
            </Typography>

            {isLoading && (
                <Alert severity="info">Loading teams history...</Alert>
            )}

            {!isLoading && pastTeams.length === 0 && (
                <Alert severity="info">
                    No past teams found. Join a league to see your team history here!
                </Alert>
            )}

            {!isLoading && pastTeams.length > 0 && (
                <>
                    <Grid container spacing={2}>
                        {currentTeams.map((team) => (
                            <Grid size={{ xs: 12, lg: 6 }} key={team.id}>
                                <Card variant="outlined" sx={{ height: '100%' }}>
                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                <TeamName
                                                    name={team.name}
                                                    primaryColor={team.colour || '#1976d2'}
                                                    size="md"
                                                />
                                            </Box>
                                            <SeasonChip dateStr={team.dateJoined} />
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {totalPages > 1 && (
                        <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
                            <Pagination
                                count={totalPages}
                                page={currentPage}
                                onChange={handlePageChange}
                                color="primary"
                                size="medium"
                                showFirstButton
                                showLastButton
                            />
                        </Stack>
                    )}

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                        Showing {startIndex + 1}-{Math.min(endIndex, pastTeams.length)} of {pastTeams.length} teams
                    </Typography>
                </>
            )}
        </Paper>
    );
}