export interface PastTeam {
    id: string;
    name: string;
    dateJoined: string;
    monthYear: string;
}
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
