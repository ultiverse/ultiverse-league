import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { getFieldsByLeagueId } from '@/api/uc';
import { useLeague } from '@/hooks/useLeague';
import { Field } from '@ultiverse/shared-types';
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
    const { selectedLeague } = useLeague();
    const [newSubfield, setNewSubfield] = useState('');
    const [selectedField, setSelectedField] = useState<Field | null>(null);
    const [useCustomVenue, setUseCustomVenue] = useState(false);

    // Fetch fields for the selected league
    const fieldsQuery = useQuery({
        queryKey: ['fields', selectedLeague?.id],
        queryFn: () => getFieldsByLeagueId(selectedLeague!.id),
        enabled: !!selectedLeague,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });

    const availableFields = useMemo(() => fieldsQuery.data || [], [fieldsQuery.data]);

    // Handle field selection
    const handleFieldSelect = (field: Field) => {
        setSelectedField(field);
        setUseCustomVenue(false);
        onFieldSlotChange({
            ...fieldSlot,
            venue: field.venue,
            subfields: field.subfields.map(sf => sf.name)
        });
    };

    // Handle custom venue toggle
    const handleToggleCustomVenue = () => {
        const newUseCustom = !useCustomVenue;
        setUseCustomVenue(newUseCustom);

        if (newUseCustom) {
            // Switching to custom mode - clear selected field but keep current venue/subfields
            setSelectedField(null);
        } else {
            // Switching back to selection mode - try to find matching field
            if (fieldSlot.venue && availableFields.length > 0) {
                const field = availableFields.find(f => f.venue === fieldSlot.venue);
                setSelectedField(field || null);
            }
        }
    };

    // Find the currently selected field based on venue name
    useEffect(() => {
        if (!useCustomVenue && fieldSlot.venue && availableFields.length > 0) {
            const field = availableFields.find(f => f.venue === fieldSlot.venue);
            setSelectedField(field || null);
        }
    }, [fieldSlot.venue, availableFields, useCustomVenue]);

    // Auto-detect if we should be in custom mode
    useEffect(() => {
        if (fieldSlot.venue && availableFields.length > 0) {
            const fieldExists = availableFields.some(f => f.venue === fieldSlot.venue);
            if (!fieldExists && !useCustomVenue) {
                setUseCustomVenue(true);
            }
        }
    }, [fieldSlot.venue, availableFields, useCustomVenue]);

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

            {fieldsQuery.isLoading ? (
                <Typography variant="body2" color="text.secondary">
                    Loading available fields...
                </Typography>
            ) : availableFields.length > 0 ? (
                <Stack spacing={1}>
                    {useCustomVenue ? (
                        <TextField
                            label="Custom Venue Name"
                            value={fieldSlot.venue}
                            onChange={(e) => onFieldSlotChange({ ...fieldSlot, venue: e.target.value })}
                            placeholder="e.g., Bowring Park"
                            fullWidth
                            required
                            helperText="Enter a custom venue name and add your own subfields below."
                        />
                    ) : (
                        <FormControl fullWidth required>
                            <InputLabel>Venue</InputLabel>
                            <Select
                                value={selectedField?.id || ''}
                                label="Venue"
                                onChange={(e) => {
                                    const field = availableFields.find(f => f.id === e.target.value);
                                    if (field) {
                                        handleFieldSelect(field);
                                    }
                                }}
                            >
                                {availableFields.map((field) => (
                                    <MenuItem key={field.id} value={field.id}>
                                        {field.venue} ({field.subfields.length} field{field.subfields.length !== 1 ? 's' : ''})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    <Button
                        variant="text"
                        size="small"
                        onClick={handleToggleCustomVenue}
                        sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                    >
                        {useCustomVenue ? '← Back to venue selection' : '+ Add new venue'}
                    </Button>
                </Stack>
            ) : (
                <TextField
                    label="Venue"
                    value={fieldSlot.venue}
                    onChange={(e) => onFieldSlotChange({ ...fieldSlot, venue: e.target.value })}
                    placeholder="e.g., Bowring Park"
                    fullWidth
                    required
                    helperText="No fields found for this league. You can enter a custom venue name."
                />
            )}

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
                {selectedField && !useCustomVenue ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Fields loaded from {selectedField.venue}. You can add additional custom fields below.
                    </Typography>
                ) : useCustomVenue && fieldSlot.venue ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Custom venue "{fieldSlot.venue}". Add your subfields below.
                    </Typography>
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Add subfields for your venue. Each subfield represents a separate playing area.
                    </Typography>
                )}
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