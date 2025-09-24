export interface TeamSummary {
  id: string;
  name: string;
  division?: string | null;
  colour: string; // Primary team color, defaults to black
  altColour: string; // Secondary team color, defaults to white
  dateJoined?: string; // ISO date (for past teams)
  monthYear?: string; // e.g., "June 2023" (for past teams)
}

export type PastTeam = TeamSummary;

export interface UserProfile {
  email: string;
  firstName: string;
  lastName: string;
  integration: 'uc' | 'native'; // connected via Ultimate Central or native auth
  pastTeams: PastTeam[];
  lastLogin: string; // ISO date
  identifies: 'man' | 'boy' | 'woman' | 'girl' | 'not_defined';
  avatarSmall?: string; // Small avatar URL
  avatarLarge?: string; // Large avatar URL
}