import {
    Stack,
    Typography,
    FormControl,
    FormControlLabel,
    Checkbox,
    TextField,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';

export interface RangeData {
    rangeMode: 'rounds' | 'endDate';
    firstDate: Dayjs | null;
    numberOfRounds: number;
    endDate: Dayjs | null;
    blackoutDates: Dayjs[];
}

interface RangeStepProps {
    range: RangeData;
    onRangeChange: (range: RangeData) => void;
    dayOfWeek: number;
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

export function RangeStep({ range, onRangeChange, dayOfWeek }: RangeStepProps) {
    return (
        <Stack spacing={3}>
            <FormControl component="fieldset">
                <Stack spacing={2}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={range.rangeMode === 'rounds'}
                                onChange={(e) => onRangeChange({
                                    ...range,
                                    rangeMode: e.target.checked ? 'rounds' : 'endDate'
                                })}
                            />
                        }
                        label="First Date + Number of Rounds"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={range.rangeMode === 'endDate'}
                                onChange={(e) => onRangeChange({
                                    ...range,
                                    rangeMode: e.target.checked ? 'endDate' : 'rounds'
                                })}
                            />
                        }
                        label="First Date + End Date"
                    />
                </Stack>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                    label="First Date"
                    value={range.firstDate}
                    onChange={(newDate) => onRangeChange({ ...range, firstDate: newDate })}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                />
            </LocalizationProvider>

            {range.rangeMode === 'rounds' ? (
                <TextField
                    label="Number of Rounds"
                    type="number"
                    value={range.numberOfRounds}
                    onChange={(e) => onRangeChange({ ...range, numberOfRounds: Number(e.target.value) })}
                    slotProps={{ htmlInput: { min: 1, max: 52 } }}
                    fullWidth
                    required
                />
            ) : (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        label="End Date"
                        value={range.endDate}
                        onChange={(newDate) => onRangeChange({ ...range, endDate: newDate })}
                        minDate={range.firstDate || undefined}
                        slotProps={{ textField: { fullWidth: true, required: true } }}
                    />
                </LocalizationProvider>
            )}

            <Typography variant="caption" color="text.secondary">
                First Date auto-snaps to the next occurrence of {DAYS_OF_WEEK[dayOfWeek]} (editable).
                {range.rangeMode === 'endDate' && range.firstDate && range.endDate &&
                    ` System will compute ${Math.ceil(range.endDate.diff(range.firstDate, 'week', true))} weekly occurrences.`
                }
            </Typography>
        </Stack>
    );
}