export interface TeamSummary {
    id: string;
    name: string;
    division?: string | null;
    colour: string;
    altColour: string;
    dateJoined?: string;
    monthYear?: string;
}
export type PastTeam = TeamSummary;
export interface UserProfile {
    email: string;
    firstName: string;
    lastName: string;
    integration: 'uc' | 'native';
    pastTeams: PastTeam[];
    lastLogin: string;
    identifies: 'man' | 'boy' | 'woman' | 'girl' | 'not_defined';
    avatarSmall?: string;
    avatarLarge?: string;
}
