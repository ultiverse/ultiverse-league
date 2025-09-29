import { ScheduleView } from '@ultiverse/shared-types';
import { createCSVContent, downloadCSV, generateCSVFileName } from '../utils/csv.util';
import { createICSContent, downloadICS, generateICSFileName } from '../utils/ics.util';
import { ICSEvent } from '../types/utils';
import { getFirstTeamName, getSecondTeamName } from './teams.helper';
import { formatFieldName } from './fields.helper';
import dayjs from 'dayjs';

/**
 * Validation functions for field slots and teams
 */
export function validateFieldSlots(subfieldCount: number, availableTeamsCount: number): boolean {
    // Each field slot (subfield) needs exactly 4 teams
    const actualSlots = Math.max(1, subfieldCount); // Default to 1 if no subfields
    const requiredTeams = actualSlots * 4;

    // Must have exactly the right number of teams for the slots
    return availableTeamsCount === requiredTeams;
}

export function getFieldSlotValidationMessage(subfieldCount: number, availableTeamsCount: number): string | null {
    const actualSlots = Math.max(1, subfieldCount);
    const requiredTeams = actualSlots * 4;

    if (availableTeamsCount < requiredTeams) {
        return `Need ${requiredTeams - availableTeamsCount} more teams for ${actualSlots} field slot${actualSlots > 1 ? 's' : ''}. Each slot requires exactly 4 teams.`;
    }

    if (availableTeamsCount > requiredTeams) {
        const extraTeams = availableTeamsCount - requiredTeams;
        const neededSlots = Math.ceil(availableTeamsCount / 4);
        const additionalSlots = neededSlots - actualSlots;
        return `${extraTeams} extra teams available. Add ${additionalSlots} more subfield${additionalSlots > 1 ? 's' : ''} or select fewer teams.`;
    }

    return null;
}

/**
 * Calculate required field slots for a given number of teams
 */
export function calculateRequiredSlots(teamCount: number): number {
    return Math.ceil(teamCount / 4);
}

/**
 * Calculate required teams for a given number of field slots
 */
export function calculateRequiredTeams(slotCount: number): number {
    return Math.max(1, slotCount) * 4;
}

/**
 * Export pod schedule to CSV
 */
export function exportPodScheduleToCSV(
    schedule: ScheduleView,
    teamNames: Record<string, string>,
    leagueName?: string,
    venue?: string,
    fieldSlots?: string[]
) {
    const csvRows: (string | number | null | undefined)[][] = [];

    // Add header row
    csvRows.push([
        'Round', 'Date', 'Time', 'Field',
        'Home Team 1', 'Home Team 2', 'Away Team 1', 'Away Team 2',
        'Game ID'
    ]);

    // Add data rows
    schedule.rounds.forEach(round => {
        round.games.forEach(game => {
            const homeTeam1 = getFirstTeamName(game.home, teamNames);
            const homeTeam2 = getSecondTeamName(game.home, teamNames);
            const awayTeam1 = getFirstTeamName(game.away, teamNames);
            const awayTeam2 = getSecondTeamName(game.away, teamNames);

            const startDate = game.start ? new Date(game.start) : null;
            const date = startDate ? startDate.toLocaleDateString() : '';
            const time = startDate ? startDate.toLocaleTimeString() : '';
            const fieldName = formatFieldName(venue, game.field, fieldSlots);

            csvRows.push([
                round.round,
                date,
                time,
                fieldName,
                homeTeam1,
                homeTeam2,
                awayTeam1,
                awayTeam2,
                game.gameId
            ]);
        });
    });

    // Convert to CSV and download
    const csvContent = createCSVContent(csvRows);
    const filename = generateCSVFileName('schedule', leagueName);
    downloadCSV(csvContent, filename);
}

/**
 * Check if a schedule generation is valid based on team and slot counts
 */
export function isScheduleGenerationValid(teamCount: number, slotCount: number): boolean {
    return validateFieldSlots(slotCount, teamCount);
}

/**
 * Get suggested field slot configuration for a given team count
 */
export function getSuggestedFieldSlots(teamCount: number): {
    requiredSlots: number;
    message: string;
} {
    const requiredSlots = calculateRequiredSlots(teamCount);

    if (teamCount === 0) {
        return {
            requiredSlots: 0,
            message: 'No teams available'
        };
    }

    if (teamCount % 4 === 0) {
        return {
            requiredSlots,
            message: `Perfect! ${teamCount} teams require exactly ${requiredSlots} field slot${requiredSlots > 1 ? 's' : ''}.`
        };
    }

    const nextValidTeamCount = requiredSlots * 4;
    const teamsToAdd = nextValidTeamCount - teamCount;

    return {
        requiredSlots,
        message: `${teamCount} teams need ${requiredSlots} field slot${requiredSlots > 1 ? 's' : ''}, but you'll need ${teamsToAdd} more team${teamsToAdd > 1 ? 's' : ''} for a perfect match.`
    };
}

/**
 * Exports pod schedule to ICS calendar format
 */
export function exportPodScheduleToICS(
    schedule: ScheduleView,
    teamNames: Record<string, string>,
    leagueName?: string,
    venue?: string,
    fieldSlots?: string[]
): void {
    const events: ICSEvent[] = [];

    schedule.rounds.forEach(round => {
        round.games.forEach(game => {
            const startTime = dayjs(game.start);
            const endTime = startTime.add(game.durationMins, 'minute');

            const homeTeam1 = getFirstTeamName(game.home, teamNames);
            const homeTeam2 = getSecondTeamName(game.home, teamNames);
            const awayTeam1 = getFirstTeamName(game.away, teamNames);
            const awayTeam2 = getSecondTeamName(game.away, teamNames);

            const title = `Round ${round.round}: ${homeTeam1} & ${homeTeam2} vs ${awayTeam1} & ${awayTeam2}`;

            let description = `League: ${leagueName || 'Unknown League'}\n`;
            description += `Round: ${round.round}\n`;
            description += `Home Team: ${homeTeam1} & ${homeTeam2}\n`;
            description += `Away Team: ${awayTeam1} & ${awayTeam2}\n`;
            description += `Duration: ${game.durationMins} minutes`;

            let location = '';
            if (venue && game.field) {
                location = formatFieldName(venue, game.field, fieldSlots || []);
            } else if (venue) {
                location = venue;
            } else if (game.field) {
                location = `Field ${game.field}`;
            }

            events.push({
                uid: `${game.gameId}@ultiverse.app`,
                title,
                description,
                location,
                start: startTime.toDate(),
                end: endTime.toDate()
            });
        });
    });

    const calendarName = leagueName ? `${leagueName} Schedule` : 'Schedule';
    const icsContent = createICSContent(events, calendarName);
    const filename = generateICSFileName('schedule', leagueName);

    downloadICS(icsContent, filename);
}