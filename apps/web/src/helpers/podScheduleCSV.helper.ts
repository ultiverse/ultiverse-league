import { ScheduleView, TeamSide } from '@ultiverse/shared-types';
import { createCSVContent, downloadCSV, generateCSVFileName } from '@/utils/csv.util';

export function exportPodScheduleToCSV(
    schedule: ScheduleView,
    teamNames: Record<string, string>,
    leagueName?: string,
    venue?: string
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
            const fieldName = formatFieldName(venue, game.field);

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

function getFirstTeamName(teamSide: TeamSide, teamNames: Record<string, string>): string {
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

function getSecondTeamName(teamSide: TeamSide, teamNames: Record<string, string>): string {
    if ('pods' in teamSide && teamSide.pods && teamSide.pods[1]) {
        return teamNames[teamSide.pods[1]] || `Pod ${teamSide.pods[1]}`;
    }

    return '';
}

function formatFieldName(venue?: string, field?: string | null): string {
    if (venue && field) {
        return `${venue} - ${field}`;
    }
    if (venue) {
        return `${venue} - Main Field`;
    }
    if (field) {
        return field;
    }
    return 'Main Field';
}