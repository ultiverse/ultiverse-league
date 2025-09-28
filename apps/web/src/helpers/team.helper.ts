/**
 * Team utility functions for managing teams in the application
 */

export interface Team {
  id: string;
  name: string;
  colour?: string;
}

/**
 * Generates a unique team ID
 */
export const generateTeamId = (): string => {
  return `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generates a random color for a team from a predefined palette
 */
export const generateRandomTeamColor = (): string => {
  const colors = [
    '#1976d2', // Blue
    '#d32f2f', // Red
    '#388e3c', // Green
    '#f57c00', // Orange
    '#7b1fa2', // Purple
    '#0288d1', // Light Blue
    '#e64a19', // Deep Orange
    '#5d4037', // Brown
    '#455a64', // Blue Grey
    '#c2185b', // Pink
    '#1565c0', // Dark Blue
    '#2e7d32', // Dark Green
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Creates a new team with generated ID and random color
 */
export const createTeam = (name: string, color?: string): Team => {
  return {
    id: generateTeamId(),
    name: name.trim(),
    colour: color || generateRandomTeamColor(),
  };
};

/**
 * Validates team name (non-empty after trimming)
 */
export const isValidTeamName = (name: string): boolean => {
  return name.trim().length > 0;
};

/**
 * Checks if a team name already exists in the teams array (case-insensitive)
 */
export const isTeamNameTaken = (name: string, teams: Team[]): boolean => {
  const normalizedName = name.trim().toLowerCase();
  return teams.some(team => team.name.toLowerCase() === normalizedName);
};

/**
 * Gets the minimum number of teams required for pod scheduling
 */
export const getMinimumTeamsRequired = (): number => {
  return 4;
};

/**
 * Checks if there are enough teams for scheduling
 */
export const hasEnoughTeams = (teams: Team[]): boolean => {
  return teams.length >= getMinimumTeamsRequired();
};

/**
 * Checks if the number of teams is valid for pod scheduling (multiple of 4)
 */
export const isValidTeamCount = (teams: Team[]): boolean => {
  return teams.length > 0 && teams.length % 4 === 0;
};

/**
 * Gets the next valid team count (rounded up to nearest multiple of 4)
 */
export const getNextValidTeamCount = (currentCount: number): number => {
  if (currentCount % 4 === 0) return currentCount;
  return Math.ceil(currentCount / 4) * 4;
};

/**
 * Gets the previous valid team count (rounded down to nearest multiple of 4)
 */
export const getPreviousValidTeamCount = (currentCount: number): number => {
  return Math.floor(currentCount / 4) * 4;
};

/**
 * Checks if teams are ready for pod scheduling (enough teams and valid count)
 */
export const areTeamsReadyForScheduling = (teams: Team[]): boolean => {
  return hasEnoughTeams(teams) && isValidTeamCount(teams);
};