export interface PastTeam {
  id: string;
  name: string;
  dateJoined: string; // ISO date
  monthYear: string; // e.g., "June 2023"
}

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

export interface IUserProvider {
  getCurrentUser(): Promise<UserProfile | null>;
}
