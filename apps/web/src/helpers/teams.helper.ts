import { TeamSide } from '@ultiverse/shared-types';

/**
 * Extract the first team name from a TeamSide object
 */
export function getFirstTeamName(teamSide: TeamSide, teamNames: Record<string, string>): string {
    if ('pods' in teamSide && teamSide.pods && teamSide.pods[0]) {
        return teamNames[teamSide.pods[0]] || `Pod ${teamSide.pods[0]}`;
    }

    if ('teamId' in teamSide) {
        return teamNames[teamSide.teamId] || `Team ${teamSide.teamId}`;
    }

    if ('teamName' in teamSide && teamSide.teamName) {
        return teamSide.teamName;
    }

    return 'Unknown';
}

/**
 * Extract the second team name from a TeamSide object (for pods)
 */
export function getSecondTeamName(teamSide: TeamSide, teamNames: Record<string, string>): string {
    if ('pods' in teamSide && teamSide.pods && teamSide.pods[1]) {
        return teamNames[teamSide.pods[1]] || `Pod ${teamSide.pods[1]}`;
    }

    return '';
}

/**
 * Get display name for a team side (handles multiple teams in pods)
 */
export function getTeamDisplayName(teamSide: TeamSide, teamNames?: Record<string, string>): string {
    if ('teamName' in teamSide && teamSide.teamName) {
        return teamSide.teamName;
    }

    if ('pods' in teamSide && teamSide.pods) {
        const podNames = teamSide.pods.map(podId =>
            teamNames?.[podId] || `Pod ${podId}`
        );
        return podNames.join(' + ');
    }

    if ('teamId' in teamSide) {
        return teamNames?.[teamSide.teamId] || `Team ${teamSide.teamId}`;
    }

    return 'Unknown Team';
}

/**
 * Get team color from team data
 */
export function getTeamColor(teamSide: TeamSide, teamData?: Record<string, { id: string; name: string; colour: string; }>): string {
    // For pods, use default black color
    if ('pods' in teamSide && teamSide.pods) {
        return '#000000';
    }

    if ('teamId' in teamSide) {
        return teamData?.[teamSide.teamId]?.colour || '#000000';
    }

    return '#000000';
}