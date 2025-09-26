import {
    Stack,
    Typography,
    Alert,
    Paper,
    Box,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import { TeamName } from '@/components/TeamName';

export interface PairingData {
    avoidRematches: boolean;
    balancePartners: boolean;
    balanceOpponents: boolean;
}

interface PodsPairingStepProps {
    pairing: PairingData;
    onPairingChange: (pairing: PairingData) => void;
    availableTeams: Array<{ id: string; name: string; colour?: string; }>;
}

export function PodsPairingStep({ pairing, onPairingChange, availableTeams }: PodsPairingStepProps) {
    return (
        <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
                Mode: Teams (using teams from selected league as pods)
            </Typography>

            <Alert severity="info">
                Per-slot capacity: fixed at 4 teams per subfield (two per side) for MVP.
            </Alert>

            <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Available Teams ({availableTeams.length})
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {availableTeams.length > 0 ? (
                        <Stack spacing={1}>
                            {availableTeams.map((team) => (
                                <TeamName
                                    key={team.id}
                                    name={team.name}
                                    primaryColor={team.colour || '#000000'}
                                    size="sm"
                                />
                            ))}
                        </Stack>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No teams available in the selected league.
                        </Typography>
                    )}
                </Box>
            </Paper>

            <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Pairing Constraints
                </Typography>
                <Stack spacing={1}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={pairing.avoidRematches}
                                onChange={(e) => onPairingChange({
                                    ...pairing,
                                    avoidRematches: e.target.checked
                                })}
                            />
                        }
                        label="Avoid last-week rematches"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={pairing.balancePartners}
                                onChange={(e) => onPairingChange({
                                    ...pairing,
                                    balancePartners: e.target.checked
                                })}
                            />
                        }
                        label="Balance partner frequency"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={pairing.balanceOpponents}
                                onChange={(e) => onPairingChange({
                                    ...pairing,
                                    balanceOpponents: e.target.checked
                                })}
                            />
                        }
                        label="Balance opponent recency"
                    />
                </Stack>
            </Paper>
        </Stack>
    );
}