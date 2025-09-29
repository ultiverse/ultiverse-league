import { useState } from 'react';
import {
    Stack,
    Typography,
    Alert,
    Paper,
    Box,
    TextField,
    Button,
    IconButton,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { TeamName } from '../TeamName.component';
import { createTeam, isValidTeamName, isTeamNameTaken, getMinimumTeamsRequired, hasEnoughTeams, isValidTeamCount, areTeamsReadyForScheduling, getNextValidTeamCount } from '../../helpers/team.helper';
import { Team } from '../../types/utils';
import { PairingData, PodsPairingStepProps } from '../../types/wizard';

export function PodsPairingStep({ availableTeams, onTeamsChange }: PodsPairingStepProps) {
    const [newTeamName, setNewTeamName] = useState('');

    const handleAddTeam = () => {
        if (isValidTeamName(newTeamName) && onTeamsChange) {
            if (isTeamNameTaken(newTeamName, availableTeams)) {
                // Could add error handling here if needed
                return;
            }

            const newTeam = createTeam(newTeamName);
            onTeamsChange([...availableTeams, newTeam]);
            setNewTeamName('');
        }
    };

    const handleRemoveTeam = (teamId: string) => {
        if (onTeamsChange) {
            onTeamsChange(availableTeams.filter(team => team.id !== teamId));
        }
    };

    const minTeamsNeeded = getMinimumTeamsRequired();
    const needsMoreTeams = !hasEnoughTeams(availableTeams);
    const hasValidTeamCount = isValidTeamCount(availableTeams);
    const isReadyForScheduling = areTeamsReadyForScheduling(availableTeams);
    const nextValidCount = getNextValidTeamCount(availableTeams.length);

    return (
        <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
                Configure the teams that will participate in the league. You need at least 4 teams and the total must be a multiple of 4 for pod scheduling.
            </Typography>

            {needsMoreTeams && (
                <Alert severity="warning">
                    You need at least {minTeamsNeeded} teams to generate a schedule.
                    Currently you have {availableTeams.length} team{availableTeams.length !== 1 ? 's' : ''}.
                </Alert>
            )}

            {hasEnoughTeams(availableTeams) && !hasValidTeamCount && (
                <Alert severity="warning">
                    Team count must be a multiple of 4 for pod scheduling.
                    You have {availableTeams.length} teams. Add {nextValidCount - availableTeams.length} more team{nextValidCount - availableTeams.length !== 1 ? 's' : ''} to reach {nextValidCount} teams.
                </Alert>
            )}

            {/* Add Team Section */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Add Team
                </Typography>
                <Stack direction="row" spacing={1}>
                    <TextField
                        label="Team Name"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                        placeholder="e.g., Lightning Bolts"
                        size="small"
                        sx={{ flexGrow: 1 }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleAddTeam}
                        disabled={!newTeamName.trim()}
                        startIcon={<Add />}
                    >
                        Add Team
                    </Button>
                </Stack>
            </Paper>

            {/* Teams List */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Teams ({availableTeams.length})
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {availableTeams.length > 0 ? (
                        <Stack spacing={1}>
                            {availableTeams.map((team) => (
                                <Box
                                    key={team.id}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: 1,
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: 1
                                    }}
                                >
                                    <TeamName
                                        name={team.name}
                                        primaryColor={team.colour || '#000000'}
                                        size="sm"
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={() => handleRemoveTeam(team.id)}
                                        color="error"
                                    >
                                        <Delete />
                                    </IconButton>
                                </Box>
                            ))}
                        </Stack>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No teams added yet. Add teams above to get started.
                        </Typography>
                    )}
                </Box>
            </Paper>

            {isReadyForScheduling && (
                <Alert severity="success">
                    ✓ Ready to proceed with {availableTeams.length} teams ({availableTeams.length / 4} pods of 4 teams each)
                </Alert>
            )}
        </Stack>
    );
}