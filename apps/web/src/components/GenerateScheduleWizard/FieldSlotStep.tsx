import { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Stack,
    Button,
    Alert,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';

export interface FieldSlotData {
    venue: string;
    dayOfWeek: number;
    startTime: Dayjs | null;
    duration: number;
    subfields: string[];
}

interface FieldSlotStepProps {
    fieldSlot: FieldSlotData;
    onFieldSlotChange: (fieldSlot: FieldSlotData) => void;
    onDayOfWeekChange?: (dayOfWeek: number) => void;
    availableTeamsCount?: number;
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

export function FieldSlotStep({ fieldSlot, onFieldSlotChange, onDayOfWeekChange, availableTeamsCount = 0 }: FieldSlotStepProps) {
    const [newSubfield, setNewSubfield] = useState('');

    const handleAddSubfield = () => {
        if (newSubfield.trim() && !fieldSlot.subfields.includes(newSubfield.trim())) {
            onFieldSlotChange({
                ...fieldSlot,
                subfields: [...fieldSlot.subfields, newSubfield.trim()]
            });
            setNewSubfield('');
        }
    };

    const handleRemoveSubfield = (subfieldToRemove: string) => {
        onFieldSlotChange({
            ...fieldSlot,
            subfields: fieldSlot.subfields.filter(sf => sf !== subfieldToRemove)
        });
    };

    // Validation logic for field slots vs available teams
    const actualSlots = Math.max(1, fieldSlot.subfields.length);
    const requiredTeams = actualSlots * 4;
    const hasInsufficientSlots = availableTeamsCount > requiredTeams;
    const neededSlots = Math.ceil(availableTeamsCount / 4);

    return (
        <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
                A weekly slot defines your day, time, and fields (subfields). We'll create one round per week using this slot.
            </Typography>

            <TextField
                label="Venue"
                value={fieldSlot.venue}
                onChange={(e) => onFieldSlotChange({ ...fieldSlot, venue: e.target.value })}
                placeholder="e.g., Bowring Park"
                fullWidth
                required
            />

            <FormControl fullWidth>
                <InputLabel>Day of Week</InputLabel>
                <Select
                    value={fieldSlot.dayOfWeek}
                    label="Day of Week"
                    onChange={(e) => {
                        const dayOfWeek = Number(e.target.value);
                        onFieldSlotChange({ ...fieldSlot, dayOfWeek });
                        onDayOfWeekChange?.(dayOfWeek);
                    }}
                >
                    {DAYS_OF_WEEK.map((day, index) => (
                        <MenuItem key={index} value={index}>
                            {day}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                    label="Start Time"
                    value={fieldSlot.startTime}
                    onChange={(newTime) => onFieldSlotChange({ ...fieldSlot, startTime: newTime })}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                />
            </LocalizationProvider>

            <TextField
                label="Duration (minutes)"
                type="number"
                value={fieldSlot.duration}
                onChange={(e) => onFieldSlotChange({ ...fieldSlot, duration: Number(e.target.value) })}
                slotProps={{ htmlInput: { min: 30, max: 180 } }}
                fullWidth
            />

            <Box>
                <Typography variant="subtitle2" gutterBottom>
                    Subfields
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <TextField
                        size="small"
                        placeholder="e.g., Field A"
                        value={newSubfield}
                        onChange={(e) => setNewSubfield(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubfield()}
                    />
                    <Button
                        variant="outlined"
                        onClick={handleAddSubfield}
                        startIcon={<Add />}
                        disabled={!newSubfield.trim()}
                    >
                        Add
                    </Button>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {fieldSlot.subfields.map((subfield) => (
                        <Chip
                            key={subfield}
                            label={subfield}
                            onDelete={() => handleRemoveSubfield(subfield)}
                            deleteIcon={<Delete />}
                        />
                    ))}
                </Stack>
            </Box>

            {hasInsufficientSlots && availableTeamsCount > 0 && (
                <Alert severity="warning">
                    <Typography variant="body2">
                        <strong>Field Slot Warning:</strong> You have {availableTeamsCount} teams available but only {actualSlots} field slot{actualSlots > 1 ? 's' : ''}.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        Each field slot requires exactly 4 teams (2 vs 2). Consider adding {neededSlots - actualSlots} more subfield{neededSlots - actualSlots > 1 ? 's' : ''} to accommodate all teams.
                    </Typography>
                </Alert>
            )}
        </Stack>
    );
}