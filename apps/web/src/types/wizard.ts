export interface RangeData {
    startDate: Date | null;
    endDate: Date | null;
}

export interface RangeStepProps {
    value: RangeData;
    onChange: (value: RangeData) => void;
    onNext: () => void;
    onBack: () => void;
}

export interface PairingData {
    selectedTeamIds: string[];
}

export interface PodsPairingStepProps {
    value: PairingData;
    onChange: (value: PairingData) => void;
    onNext: () => void;
    onBack: () => void;
}

export interface FieldSlot {
    name: string;
    subfields?: string[];
}

export interface FieldSlotData {
    venue: string;
    fieldSlots: number;
    fields: FieldSlot[];
}

export interface FieldSlotStepProps {
    value: FieldSlotData;
    onChange: (value: FieldSlotData) => void;
    onNext: () => void;
    onBack: () => void;
}

export interface PreviewStepProps {
    rangeData: RangeData;
    pairingData: PairingData;
    fieldSlotData: FieldSlotData;
    onNext: () => void;
    onBack: () => void;
}

export interface GenerateScheduleWizardProps {
    open: boolean;
    onClose: () => void;
    onComplete?: () => void;
}