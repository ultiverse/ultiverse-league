import { Dayjs } from 'dayjs';

// Range Step Types
export interface RangeData {
    rangeMode: 'rounds' | 'endDate';
    firstDate: Dayjs | null;
    numberOfRounds: number;
    endDate: Dayjs | null;
    blackoutDates: Dayjs[];
}

export interface RangeStepProps {
    range: RangeData;
    onRangeChange: (range: RangeData) => void;
}

// Pairing Step Types
export interface PairingData {
    avoidRematches: boolean;
    balancePartners: boolean;
    balanceOpponents: boolean;
}

export interface PodsPairingStepProps {
    pairing: PairingData;
    onPairingChange: (pairing: PairingData) => void;
    teams: Array<{ id: string; name: string; colour?: string; }>;
    onTeamsChange: (teams: Array<{ id: string; name: string; colour?: string; }>) => void;
}

// Field Slot Step Types
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

export interface FieldSlotStepProps {
    fieldSlot: FieldSlotData;
    onFieldSlotChange: (fieldSlot: FieldSlotData) => void;
    onDayOfWeekChange?: (dayOfWeek: number) => void;
    availableTeamsCount?: number;
}

// Preview Step Types
export interface PreviewStepProps {
    fieldSlot: FieldSlotData;
    range: RangeData;
    availableTeams: Array<{ id: string; name: string; colour?: string; }>;
}

// Main Wizard Types
export interface GenerateScheduleWizardProps {
    open: boolean;
    onClose: () => void;
    availableTeams?: Array<{ id: string; name: string; colour?: string; }>;
    onGenerate?: (scheduleData: {
        fieldSlot: FieldSlotData;
        range: RangeData;
        pairing: PairingData;
        teams: Array<{ id: string; name: string; colour?: string; }>;
    }) => void;
}