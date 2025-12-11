import { DATA_SOURCES, PROVIDERS } from '../constants/providers';
export interface TeamSummary {
    id: string;
    name: string;
    division?: string | null;
    colour: string;
    altColour: string;
    dateJoined?: string;
    monthYear?: string;
    source: typeof DATA_SOURCES[keyof typeof DATA_SOURCES] | typeof PROVIDERS[keyof typeof PROVIDERS];
}
export type PastTeam = TeamSummary;
export interface UserProfile {
    email: string;
    firstName: string;
    lastName: string;
    integration: typeof PROVIDERS.ULTIMATE_CENTRAL | 'native';
    pastTeams: PastTeam[];
    lastLogin: string;
    identifies: 'man' | 'boy' | 'woman' | 'girl' | 'not_defined';
    avatarSmall?: string;
    avatarLarge?: string;
}
