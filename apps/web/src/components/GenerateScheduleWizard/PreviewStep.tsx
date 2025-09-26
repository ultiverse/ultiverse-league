import {
    Stack,
    Typography,
    Paper,
    Box,
    Alert,
    Chip,
} from '@mui/material';
import { TeamName } from '@/components/TeamName';
import { FieldSlotData } from './FieldSlotStep';
import { RangeData } from './RangeStep';

interface PreviewStepProps {
    fieldSlot: FieldSlotData;
    range: RangeData;
    availableTeams: Array<{ id: string; name: string; colour?: string; }>;
}

const DAYS_OF_WEEK = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];

export function PreviewStep({ fieldSlot, range, availableTeams }: PreviewStepProps) {
    const totalRounds = range.rangeMode === 'rounds'
        ? range.numberOfRounds
        : range.firstDate && range.endDate
            ? Math.ceil(range.endDate.diff(range.firstDate, 'week', true))
            : 0;
    const podsNeeded = Math.max(1, fieldSlot.subfields.length) * 4;
    const availableTeamsCount = availableTeams.length;

    return (
        <Stack spacing={3}>
            <Typography variant="h6">
                Preview: {totalRounds} Rounds
            </Typography>

            <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Schedule Summary
                </Typography>
                <Typography variant="body2">
                    <strong>Venue:</strong> {fieldSlot.venue}
                </Typography>
                <Typography variant="body2">
                    <strong>Time:</strong> {DAYS_OF_WEEK[fieldSlot.dayOfWeek]}s at {fieldSlot.startTime?.format('h:mm A')}
                </Typography>
                <Typography variant="body2">
                    <strong>Duration:</strong> {fieldSlot.duration} minutes
                </Typography>
                <Typography variant="body2">
                    <strong>Subfields:</strong> {fieldSlot.subfields.join(', ')}
                </Typography>
                <Typography variant="body2">
                    <strong>Dates:</strong> {range.firstDate?.format('MMM D, YYYY')} - {totalRounds} rounds
                </Typography>
            </Paper>

            <Alert severity={availableTeamsCount >= podsNeeded ? "info" : "warning"}>
                <Typography variant="body2">
                    <strong>Teams Required:</strong> {podsNeeded} teams needed ({Math.max(1, fieldSlot.subfields.length)} {fieldSlot.subfields.length === 0 ? 'game' : 'subfields'} × 4 teams each)
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Available Teams:</strong> {availableTeamsCount} teams
                    {availableTeamsCount < podsNeeded && (
                        <span style={{ color: 'error.main' }}> - Not enough teams! Need {podsNeeded - availableTeamsCount} more.</span>
                    )}
                </Typography>
            </Alert>

            {totalRounds > 0 && (
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                        Round Preview (Sample)
                    </Typography>

                    {[1, 2, 3].slice(0, Math.min(3, totalRounds)).map((roundNum) => (
                        <Paper key={roundNum} sx={{ p: 2, mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Round {roundNum} — {DAYS_OF_WEEK[fieldSlot.dayOfWeek]}, {
                                    range.firstDate?.add((roundNum - 1) * 7, 'day').format('MMM D')
                                } • {fieldSlot.startTime?.format('h:mm A')} — {fieldSlot.venue}
                            </Typography>

                            {(fieldSlot.subfields.length > 0 ? fieldSlot.subfields : ['Main Field']).map((subfield, idx) => {
                                const team1 = availableTeams[idx * 4];
                                const team2 = availableTeams[idx * 4 + 1];
                                const team3 = availableTeams[idx * 4 + 2];
                                const team4 = availableTeams[idx * 4 + 3];

                                return (
                                    <Box key={subfield} sx={{ py: 1 }}>
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                            <Typography variant="body2" sx={{ minWidth: 80, fontWeight: 'medium' }}>
                                                {subfield}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                — {fieldSlot.startTime?.format('h:mm A')}
                                            </Typography>
                                        </Stack>

                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ pl: 2 }}>
                                            {team1 && team2 ? (
                                                <TeamName
                                                    name={`${team1.name} + ${team2.name}`}
                                                    primaryColor={'#000000'}
                                                    size="sm"
                                                    variant="chip"
                                                />
                                            ) : (
                                                <>
                                                    <Chip label="Team 1" size="small" />
                                                    <Typography variant="body2">+</Typography>
                                                    <Chip label="Team 2" size="small" />
                                                </>
                                            )}

                                            <Typography variant="body2" sx={{ mx: 1 }}>vs</Typography>
                                            {team3 ? (
                                                <TeamName
                                                    name={team3.name}
                                                    primaryColor={team3.colour || '#000000'}
                                                    size="sm"
                                                    variant="chip"
                                                />
                                            ) : (
                                                <Chip label="Team 3" size="small" />
                                            )}
                                            <Typography variant="body2">+</Typography>
                                            {team4 ? (
                                                <TeamName
                                                    name={team4.name}
                                                    primaryColor={team4.colour || '#000000'}
                                                    size="sm"
                                                    variant="chip"
                                                />
                                            ) : (
                                                <Chip label="Team 4" size="small" />
                                            )}
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Paper>
                    ))}

                    {totalRounds > 3 && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                            ... and {totalRounds - 3} more rounds
                        </Typography>
                    )}
                </Box>
            )}
        </Stack>
    );
}