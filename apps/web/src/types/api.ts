
export interface LeagueSummary {
    id: string;
    name: string;
    start?: string;
    end?: string;
    provider?: string;
    externalId?: string;
}

export interface TeamSummary {
    id: string;
    name: string;
    division?: string | null;
    colour: string;
    altColour: string;
    dateJoined?: string;
    monthYear?: string;
    photoUrl?: string | null;
}

export interface GenerateScheduleRequest {
    pods: string[];
    rounds: number;
    recencyWindow?: number;
    pairingMode?: 'each-vs-both' | 'single';
    names?: Record<string, string>;
    leagueId?: string;
}