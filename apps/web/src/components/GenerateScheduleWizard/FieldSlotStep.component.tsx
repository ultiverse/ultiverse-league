import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Typography,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
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

export interface FieldSlot {
    id: string;
    venue: string;
    dayOfWeek: number;
    startTime: Dayjs | null;
    duration: number;
    subfield?: string;
}

export interface FieldSlotData {
    venue: string;
    dayOfWeek: number;
    startTime: Dayjs | null;
    duration: number;
    subfields: string[];
    fieldSlots: FieldSlot[];
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
    const [selectedField, setSelectedField] = useState<Field | null>(null);
    const [useCustomVenue, setUseCustomVenue] = useState(false);

    // Input form state
    const [inputVenue, setInputVenue] = useState('');
    const [inputSubfield, setInputSubfield] = useState('');

    // Helper function to add a field slot
    const addFieldSlot = (venue: string, subfield?: string) => {
        const newFieldSlot: FieldSlot = {
            id: `${Date.now()}-${Math.random()}`,
            venue,
            dayOfWeek: fieldSlot.dayOfWeek,
            startTime: fieldSlot.startTime,
            duration: fieldSlot.duration,
            subfield,
        };

        const updatedFieldSlots = [...(fieldSlot.fieldSlots || []), newFieldSlot];
        const updatedSubfields = subfield ? [...fieldSlot.subfields, subfield] : fieldSlot.subfields;

        onFieldSlotChange({
            ...fieldSlot,
            venue: venue, // Update main venue if not set
            fieldSlots: updatedFieldSlots,
            subfields: updatedSubfields,
        });
    };

    // Helper function to remove a field slot
    const removeFieldSlot = (id: string) => {
        const slotToRemove = fieldSlot.fieldSlots?.find(slot => slot.id === id);
        const updatedFieldSlots = fieldSlot.fieldSlots?.filter(slot => slot.id !== id) || [];
        const updatedSubfields = slotToRemove?.subfield
            ? fieldSlot.subfields.filter(sub => sub !== slotToRemove.subfield)
            : fieldSlot.subfields;

        onFieldSlotChange({
            ...fieldSlot,
            fieldSlots: updatedFieldSlots,
            subfields: updatedSubfields,
        });
    };

    // Fetch fields for the selected league
    const fieldsQuery = useQuery({
        queryKey: ['fields', selectedLeague?.id],
        queryFn: () => getFieldsByLeagueId(selectedLeague!.id),
        enabled: !!selectedLeague,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });

    const availableFields = useMemo(() => fieldsQuery.data || [], [fieldsQuery.data]);

    // Handle custom venue toggle
    const handleToggleCustomVenue = () => {
        const newUseCustom = !useCustomVenue;
        setUseCustomVenue(newUseCustom);

        if (newUseCustom) {
            // Switching to custom mode - clear selected field and input venue
            setSelectedField(null);
            setInputVenue('');
        } else {
            // Switching back to selection mode
            setInputVenue('');
        }
    };


    return (
        <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
                Configure your weekly field slots. Each slot accommodates 4 teams (2v2 games).
                {availableTeamsCount > 0 && ` You need ${Math.ceil(availableTeamsCount / 4)} slot${Math.ceil(availableTeamsCount / 4) !== 1 ? 's' : ''} for ${availableTeamsCount} teams.`}
            </Typography>

            {/* Input Group */}
            <Box sx={{ p: 3, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                    Add Field Slot
                </Typography>

                <Stack spacing={2}>
                    {/* Venue Selection */}
                    {fieldsQuery.isLoading ? (
                        <Typography variant="body2" color="text.secondary">
                            Loading available fields...
                        </Typography>
                    ) : fieldsQuery.isError ? (
                        <Alert severity="error">
                            Failed to load available fields. You can still add custom field slots.
                        </Alert>
                    ) : availableFields.length > 0 ? (
                        <Stack spacing={1}>
                            {useCustomVenue ? (
                                <TextField
                                    label="Venue Name"
                                    value={inputVenue}
                                    onChange={(e) => setInputVenue(e.target.value)}
                                    placeholder="e.g., Bowring Park"
                                    fullWidth
                                    required
                                />
                            ) : (
                                <FormControl fullWidth required>
                                    <InputLabel>Venue</InputLabel>
                                    <Select
                                        value={inputVenue}
                                        label="Select Venue"
                                        onChange={(e) => {
                                            const field = availableFields.find(f => f.venue === e.target.value);
                                            if (field) {
                                                setInputVenue(field.venue);
                                                setSelectedField(field);
                                            }
                                        }}
                                    >
                                        {availableFields.map((field) => (
                                            <MenuItem key={field.id} value={field.venue}>
                                                {field.venue} {field.subfields.length > 0
                                                    ? `(${field.subfields.length} subfield${field.subfields.length !== 1 ? 's' : ''})`
                                                    : '(single field)'
                                                }
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
                                {useCustomVenue ? '← Choose existing venues' : '+ Add venue'}
                            </Button>
                        </Stack>
                    ) : (
                        <TextField
                            label="Venue Name"
                            value={inputVenue}
                            onChange={(e) => setInputVenue(e.target.value)}
                            placeholder="e.g., Bowring Park"
                            fullWidth
                            required
                            helperText="No fields found for this league. Enter a custom venue name."
                        />
                    )}

                    {/* Day, Time, Duration */}
                    <Stack direction="row" spacing={2}>
                        <FormControl sx={{ minWidth: 150 }}>
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
                                slotProps={{ textField: { sx: { minWidth: 140 } } }}
                            />
                        </LocalizationProvider>

                        <TextField
                            label="Duration (min)"
                            type="number"
                            value={fieldSlot.duration}
                            onChange={(e) => onFieldSlotChange({ ...fieldSlot, duration: Number(e.target.value) })}
                            slotProps={{ htmlInput: { min: 30, max: 180 } }}
                            sx={{ minWidth: 120 }}
                        />
                    </Stack>

                    {/* Subfield Input */}
                    <TextField
                        label="Subfield (optional)"
                        value={inputSubfield}
                        onChange={(e) => setInputSubfield(e.target.value)}
                        placeholder="e.g., Field A, Court 1"
                        fullWidth
                        helperText="Leave empty for main venue, or specify a subfield"
                    />

                    {/* Add Slot Button */}
                    <Button
                        variant="contained"
                        onClick={() => {
                            if (inputVenue.trim()) {
                                addFieldSlot(inputVenue.trim(), inputSubfield.trim() || undefined);
                                setInputSubfield('');
                                if (useCustomVenue) {
                                    setInputVenue('');
                                }
                            }
                        }}
                        disabled={!inputVenue.trim()}
                        startIcon={<Add />}
                        sx={{ alignSelf: 'flex-start' }}
                    >
                        Add Slot
                    </Button>

                    {/* Quick Add Buttons */}
                    {availableFields.length > 0 && selectedField && !useCustomVenue && selectedField.subfields.length > 0 && (
                        <Box>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                Quick add subfields from {selectedField.venue}:
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                {selectedField.subfields.map((subfield) => (
                                    <Button
                                        key={subfield.id}
                                        size="small"
                                        variant="outlined"
                                        onClick={() => {
                                            addFieldSlot(selectedField.venue, subfield.name);
                                        }}
                                        disabled={fieldSlot.fieldSlots?.some(slot =>
                                            slot.venue === selectedField.venue && slot.subfield === subfield.name
                                        )}
                                    >
                                        {subfield.name}
                                    </Button>
                                ))}
                            </Stack>
                        </Box>
                    )}
                </Stack>
            </Box>

            {/* Summary Section */}
            {(fieldSlot.fieldSlots?.length || 0) > 0 && (
                <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Field Slots Summary ({fieldSlot.fieldSlots?.length || 0} slot{(fieldSlot.fieldSlots?.length || 0) !== 1 ? 's' : ''})
                    </Typography>

                    <Stack spacing={1}>
                        {fieldSlot.fieldSlots?.map((slot) => (
                            <Box
                                key={slot.id}
                                sx={{
                                    p: 2,
                                    border: 1,
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <Stack spacing={0.5}>
                                    <Typography variant="subtitle2">
                                        {slot.venue}{slot.subfield ? ` - ${slot.subfield}` : ''}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {DAYS_OF_WEEK[slot.dayOfWeek]} • {slot.startTime?.format('h:mm A')} • {slot.duration} min • 4 teams capacity
                                    </Typography>
                                </Stack>
                                <Button
                                    size="small"
                                    onClick={() => removeFieldSlot(slot.id)}
                                    startIcon={<Delete />}
                                    color="error"
                                >
                                    Remove
                                </Button>
                            </Box>
                        ))}
                    </Stack>

                    {availableTeamsCount > 0 && (
                        <Typography
                            variant="body2"
                            color={(fieldSlot.fieldSlots?.length || 0) * 4 >= availableTeamsCount ? "success.main" : "warning.main"}
                            sx={{ mt: 2, fontWeight: 500 }}
                        >
                            {(fieldSlot.fieldSlots?.length || 0) * 4 >= availableTeamsCount
                                ? `✓ Sufficient capacity: ${(fieldSlot.fieldSlots?.length || 0) * 4} teams capacity for ${availableTeamsCount} teams`
                                : `⚠️ Need ${Math.ceil(availableTeamsCount / 4) - (fieldSlot.fieldSlots?.length || 0)} more slot${Math.ceil(availableTeamsCount / 4) - (fieldSlot.fieldSlots?.length || 0) !== 1 ? 's' : ''}: ${(fieldSlot.fieldSlots?.length || 0) * 4} capacity for ${availableTeamsCount} teams`
                            }
                        </Typography>
                    )}
                </Box>
            )}
        </Stack>
    );
}