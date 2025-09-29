import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Drawer,
    AppBar,
    Toolbar,
    IconButton,
    Stepper,
    Step,
    StepLabel,
    Button,
    Stack,
    Divider,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { FieldSlotStep } from './GenerateScheduleWizard/FieldSlotStep.component';
import { RangeStep } from './GenerateScheduleWizard/RangeStep.component';
import { PodsPairingStep } from './GenerateScheduleWizard/PodsPairingStep.component';
import { PreviewStep } from './GenerateScheduleWizard/PreviewStep.component';
import { FieldSlotData, RangeData, PairingData } from '../types/wizard';
import { validateFieldSlots } from '../helpers/schedule.helper';
import { getNextOccurrenceOfDay } from '../helpers/date.helper';
import { areTeamsReadyForScheduling } from '../helpers/team.helper';
import { Team } from '../types/utils';
import { GenerateScheduleWizardProps } from '../types/wizard';

const steps = [
    'Teams',
    'Field Slot',
    'Range',
    'Preview & Conflicts'
];


export function GenerateScheduleWizard({ open, onClose, onGenerate, availableTeams = [] }: GenerateScheduleWizardProps) {
    const [activeStep, setActiveStep] = useState(0);
    const [teams, setTeams] = useState<Team[]>(availableTeams);

    // Sync teams when availableTeams prop changes
    useEffect(() => {
        setTeams(availableTeams);
    }, [availableTeams]);

    // Step 1: Field Slot
    const [fieldSlot, setFieldSlot] = useState<FieldSlotData>({
        venue: '',
        dayOfWeek: 3, // Wednesday
        startTime: dayjs().hour(17).minute(30), // 5:30 PM
        duration: 90,
        subfields: [],
        fieldSlots: []
    });

    // Step 2: Range
    const [range, setRange] = useState<RangeData>({
        rangeMode: 'rounds',
        firstDate: getNextOccurrenceOfDay(3), // Initialize to next Wednesday
        numberOfRounds: 8,
        endDate: null,
        blackoutDates: []
    });

    // Step 3: Pairing
    const [pairing, setPairing] = useState<PairingData>({
        avoidRematches: true,
        balancePartners: true,
        balanceOpponents: true
    });

    const handleNext = () => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleGenerate = () => {
        if (onGenerate) {
            onGenerate({
                fieldSlot,
                range,
                pairing,
                teams
            });
        }
        onClose();
    };

    const handleDayOfWeekChange = (dayOfWeek: number) => {
        const nextOccurrence = getNextOccurrenceOfDay(dayOfWeek);
        setRange(prev => ({ ...prev, firstDate: nextOccurrence }));
    };

    const canProceedFromStep = (step: number): boolean => {
        switch (step) {
            case 0: // Teams
                return areTeamsReadyForScheduling(teams);
            case 1: // Field Slot
                return fieldSlot.venue.trim() !== '' &&
                    fieldSlot.startTime !== null;
            case 2: // Range
                return range.firstDate !== null &&
                    (range.rangeMode === 'rounds' ? range.numberOfRounds >= 1 : range.endDate !== null);
            case 3: { // Preview & Generate
                return validateFieldSlots(fieldSlot.fieldSlots?.length || 0, teams.length);
            }
            default:
                return true;
        }
    };

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <PodsPairingStep
                        pairing={pairing}
                        onPairingChange={setPairing}
                        availableTeams={teams}
                        onTeamsChange={setTeams}
                    />
                );

            case 1:
                return (
                    <FieldSlotStep
                        fieldSlot={fieldSlot}
                        onFieldSlotChange={setFieldSlot}
                        onDayOfWeekChange={handleDayOfWeekChange}
                        availableTeamsCount={teams.length}
                    />
                );

            case 2:
                return (
                    <RangeStep
                        range={range}
                        onRangeChange={setRange}
                        dayOfWeek={fieldSlot.dayOfWeek}
                    />
                );

            case 3:
                return (
                    <PreviewStep
                        fieldSlot={fieldSlot}
                        range={range}
                        availableTeams={teams}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                slotProps={{
                    paper: {
                        sx: {
                            width: { xs: '100%', sm: 480, md: 600 },
                            maxWidth: '100vw',
                            backgroundColor: 'background.paper'
                        }
                    }
                }}
            >
                <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
                    <Toolbar>
                        <Typography variant="h6" sx={{ flexGrow: 1, color: 'text.primary' }}>
                            Generate Schedule
                        </Typography>
                        <IconButton
                            edge="end"
                            onClick={onClose}
                            sx={{ color: 'text.primary' }}
                        >
                            <Close />
                        </IconButton>
                    </Toolbar>
                </AppBar>

                <Box sx={{ p: 3, height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    <Box sx={{ flexGrow: 1, mb: 3 }}>
                        {renderStepContent(activeStep)}
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Stack direction="row" justifyContent="space-between">
                        <Button
                            disabled={activeStep === 0}
                            onClick={handleBack}
                        >
                            Back
                        </Button>

                        <Button
                            variant="contained"
                            onClick={activeStep === steps.length - 1 ? handleGenerate : handleNext}
                            disabled={!canProceedFromStep(activeStep)}
                        >
                            {activeStep === steps.length - 1 ? 'Generate' : 'Next'}
                        </Button>
                    </Stack>
                </Box>
            </Drawer>
        </LocalizationProvider>
    );
}