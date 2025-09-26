import {
    validateFieldSlots,
    getFieldSlotValidationMessage,
    calculateRequiredSlots,
    calculateRequiredTeams,
    isScheduleGenerationValid,
    getSuggestedFieldSlots,
    exportPodScheduleToCSV,
    exportPodScheduleToICS
} from '../schedule.helper';
import { ScheduleView } from '@ultiverse/shared-types';

import { vi } from 'vitest';

// Mock the CSV and team helper dependencies
vi.mock('@/utils/csv.util', () => ({
    createCSVContent: vi.fn(() => 'mocked,csv,content'),
    downloadCSV: vi.fn(),
    generateCSVFileName: vi.fn(() => 'mock_file.csv')
}));

vi.mock('../teams.helper', () => ({
    getFirstTeamName: vi.fn(() => 'Team 1'),
    getSecondTeamName: vi.fn(() => 'Team 2')
}));

vi.mock('../fields.helper', () => ({
    formatFieldName: vi.fn(() => 'Venue - Field A')
}));

vi.mock('@/utils/ics.util', () => ({
    createICSContent: vi.fn(() => 'mocked,ics,content'),
    downloadICS: vi.fn(),
    generateICSFileName: vi.fn(() => 'mock_file.ics')
}));

describe('schedule.helper', () => {
    describe('validateFieldSlots', () => {
        it('should return true when teams match slots exactly', () => {
            expect(validateFieldSlots(2, 8)).toBe(true); // 2 slots * 4 teams = 8 teams
            expect(validateFieldSlots(1, 4)).toBe(true); // 1 slot * 4 teams = 4 teams
            expect(validateFieldSlots(3, 12)).toBe(true); // 3 slots * 4 teams = 12 teams
        });

        it('should return false when teams do not match slots', () => {
            expect(validateFieldSlots(2, 7)).toBe(false); // 2 slots need 8 teams, got 7
            expect(validateFieldSlots(1, 5)).toBe(false); // 1 slot needs 4 teams, got 5
            expect(validateFieldSlots(3, 10)).toBe(false); // 3 slots need 12 teams, got 10
        });

        it('should handle zero subfields as 1 slot', () => {
            expect(validateFieldSlots(0, 4)).toBe(true); // 0 subfields = 1 slot = 4 teams
            expect(validateFieldSlots(0, 5)).toBe(false); // 0 subfields = 1 slot ≠ 5 teams
        });

        it('should handle edge cases', () => {
            expect(validateFieldSlots(0, 0)).toBe(false); // 1 slot needs 4 teams, got 0
            expect(validateFieldSlots(1, 0)).toBe(false); // 1 slot needs 4 teams, got 0
        });
    });

    describe('getFieldSlotValidationMessage', () => {
        it('should return null when validation passes', () => {
            expect(getFieldSlotValidationMessage(2, 8)).toBeNull();
            expect(getFieldSlotValidationMessage(0, 4)).toBeNull();
        });

        it('should return message when too few teams', () => {
            const message = getFieldSlotValidationMessage(2, 6);
            expect(message).toBe('Need 2 more teams for 2 field slots. Each slot requires exactly 4 teams.');
        });

        it('should return message when too many teams', () => {
            const message = getFieldSlotValidationMessage(1, 6);
            expect(message).toBe('2 extra teams available. Add 1 more subfield or select fewer teams.');
        });

        it('should handle singular/plural correctly', () => {
            const singleSlot = getFieldSlotValidationMessage(1, 2);
            expect(singleSlot).toBe('Need 2 more teams for 1 field slot. Each slot requires exactly 4 teams.');

            const multipleSlots = getFieldSlotValidationMessage(0, 10);
            expect(multipleSlots).toBe('6 extra teams available. Add 2 more subfields or select fewer teams.');
        });

        it('should handle zero subfields as 1 slot', () => {
            const message = getFieldSlotValidationMessage(0, 6);
            expect(message).toBe('2 extra teams available. Add 1 more subfield or select fewer teams.');
        });
    });

    describe('calculateRequiredSlots', () => {
        it('should calculate correct slots for team counts', () => {
            expect(calculateRequiredSlots(4)).toBe(1);
            expect(calculateRequiredSlots(8)).toBe(2);
            expect(calculateRequiredSlots(12)).toBe(3);
        });

        it('should round up for partial teams', () => {
            expect(calculateRequiredSlots(5)).toBe(2); // 5 teams need 2 slots
            expect(calculateRequiredSlots(7)).toBe(2); // 7 teams need 2 slots
            expect(calculateRequiredSlots(9)).toBe(3); // 9 teams need 3 slots
        });

        it('should handle edge cases', () => {
            expect(calculateRequiredSlots(0)).toBe(0);
            expect(calculateRequiredSlots(1)).toBe(1);
        });
    });

    describe('calculateRequiredTeams', () => {
        it('should calculate correct teams for slot counts', () => {
            expect(calculateRequiredTeams(1)).toBe(4);
            expect(calculateRequiredTeams(2)).toBe(8);
            expect(calculateRequiredTeams(3)).toBe(12);
        });

        it('should handle zero slots as 1 slot', () => {
            expect(calculateRequiredTeams(0)).toBe(4);
        });
    });

    describe('isScheduleGenerationValid', () => {
        it('should return true for valid combinations', () => {
            expect(isScheduleGenerationValid(8, 2)).toBe(true);
            expect(isScheduleGenerationValid(4, 1)).toBe(true);
            expect(isScheduleGenerationValid(4, 0)).toBe(true); // 0 slots = 1 slot
        });

        it('should return false for invalid combinations', () => {
            expect(isScheduleGenerationValid(7, 2)).toBe(false);
            expect(isScheduleGenerationValid(5, 1)).toBe(false);
        });
    });

    describe('getSuggestedFieldSlots', () => {
        it('should return perfect match message for exact multiples of 4', () => {
            const result = getSuggestedFieldSlots(8);
            expect(result.requiredSlots).toBe(2);
            expect(result.message).toBe('Perfect! 8 teams require exactly 2 field slots.');
        });

        it('should return singular message for 4 teams', () => {
            const result = getSuggestedFieldSlots(4);
            expect(result.requiredSlots).toBe(1);
            expect(result.message).toBe('Perfect! 4 teams require exactly 1 field slot.');
        });

        it('should suggest adding teams for non-multiples of 4', () => {
            const result = getSuggestedFieldSlots(6);
            expect(result.requiredSlots).toBe(2);
            expect(result.message).toBe('6 teams need 2 field slots, but you\'ll need 2 more teams for a perfect match.');
        });

        it('should handle singular team addition', () => {
            const result = getSuggestedFieldSlots(7);
            expect(result.requiredSlots).toBe(2);
            expect(result.message).toBe('7 teams need 2 field slots, but you\'ll need 1 more team for a perfect match.');
        });

        it('should handle zero teams', () => {
            const result = getSuggestedFieldSlots(0);
            expect(result.requiredSlots).toBe(0);
            expect(result.message).toBe('No teams available');
        });

        it('should handle single team', () => {
            const result = getSuggestedFieldSlots(1);
            expect(result.requiredSlots).toBe(1);
            expect(result.message).toBe('1 teams need 1 field slot, but you\'ll need 3 more teams for a perfect match.');
        });
    });

    describe('exportPodScheduleToCSV', () => {
        const mockSchedule: ScheduleView = {
            rounds: [
                {
                    round: 1,
                    games: [
                        {
                            gameId: 'game1',
                            start: '2023-06-01T18:00:00Z',
                            durationMins: 90,
                            field: 'Field A',
                            home: { pods: ['team1', 'team2'] },
                            away: { pods: ['team3', 'team4'] }
                        }
                    ]
                }
            ]
        };

        const mockTeamNames = {
            team1: 'Team One',
            team2: 'Team Two',
            team3: 'Team Three',
            team4: 'Team Four'
        };

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should call helper functions correctly', async () => {
            const { getFirstTeamName, getSecondTeamName } = await import('../teams.helper');
            const { formatFieldName } = await import('../fields.helper');

            exportPodScheduleToCSV(mockSchedule, mockTeamNames, 'Test League', 'Test Venue', ['Field A']);

            expect(getFirstTeamName).toHaveBeenCalledWith(
                { pods: ['team1', 'team2'] },
                mockTeamNames
            );
            expect(getSecondTeamName).toHaveBeenCalledWith(
                { pods: ['team1', 'team2'] },
                mockTeamNames
            );
            expect(formatFieldName).toHaveBeenCalledWith('Test Venue', 'Field A', ['Field A']);
        });

        it('should create CSV with correct structure', async () => {
            const { createCSVContent } = await import('@/utils/csv.util');

            exportPodScheduleToCSV(mockSchedule, mockTeamNames, 'Test League');

            expect(createCSVContent).toHaveBeenCalledWith(
                expect.arrayContaining([
                    ['Round', 'Date', 'Time', 'Field', 'Home Team 1', 'Home Team 2', 'Away Team 1', 'Away Team 2', 'Game ID'],
                    expect.arrayContaining([1, expect.any(String), expect.any(String), 'Venue - Field A', 'Team 1', 'Team 2', 'Team 1', 'Team 2', 'game1'])
                ])
            );
        });

        it('should generate filename and download CSV', async () => {
            const { generateCSVFileName, downloadCSV } = await import('@/utils/csv.util');

            exportPodScheduleToCSV(mockSchedule, mockTeamNames, 'Test League');

            expect(generateCSVFileName).toHaveBeenCalledWith('schedule', 'Test League');
            expect(downloadCSV).toHaveBeenCalledWith('mocked,csv,content', 'mock_file.csv');
        });

        it('should handle empty schedule', async () => {
            const { createCSVContent } = await import('@/utils/csv.util');
            const emptySchedule: ScheduleView = { rounds: [] };

            exportPodScheduleToCSV(emptySchedule, {});

            expect(createCSVContent).toHaveBeenCalledWith([
                ['Round', 'Date', 'Time', 'Field', 'Home Team 1', 'Home Team 2', 'Away Team 1', 'Away Team 2', 'Game ID']
            ]);
        });
    });

    describe('exportPodScheduleToICS', () => {
        const mockSchedule: ScheduleView = {
            rounds: [
                {
                    round: 1,
                    games: [
                        {
                            gameId: 'game1',
                            start: '2023-06-01T18:00:00Z',
                            durationMins: 90,
                            field: 'Field A',
                            home: { pods: ['team1', 'team2'] },
                            away: { pods: ['team3', 'team4'] }
                        }
                    ]
                }
            ]
        };

        const mockTeamNames = {
            team1: 'Team One',
            team2: 'Team Two',
            team3: 'Team Three',
            team4: 'Team Four'
        };

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should call ICS helper functions correctly', async () => {
            const { createICSContent, downloadICS, generateICSFileName } = await import('@/utils/ics.util');

            exportPodScheduleToICS(mockSchedule, mockTeamNames, 'Test League', 'Test Venue', ['Field A']);

            expect(createICSContent).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        uid: 'game1@ultiverse.app',
                        title: 'Round 1: Team 1 & Team 2 vs Team 1 & Team 2',
                        location: 'Venue - Field A'
                    })
                ]),
                'Test League Schedule'
            );

            expect(generateICSFileName).toHaveBeenCalledWith('schedule', 'Test League');
            expect(downloadICS).toHaveBeenCalledWith('mocked,ics,content', 'mock_file.ics');
        });

        it('should create events with correct structure', async () => {
            const { createICSContent } = await import('@/utils/ics.util');

            exportPodScheduleToICS(mockSchedule, mockTeamNames, 'Test League');

            expect(createICSContent).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        uid: expect.stringContaining('@ultiverse.app'),
                        title: expect.stringContaining('Round 1:'),
                        description: expect.stringContaining('League: Test League'),
                        start: expect.any(Date),
                        end: expect.any(Date)
                    })
                ]),
                'Test League Schedule'
            );
        });

        it('should handle empty schedule', async () => {
            const { createICSContent } = await import('@/utils/ics.util');
            const emptySchedule: ScheduleView = { rounds: [] };

            exportPodScheduleToICS(emptySchedule, {});

            expect(createICSContent).toHaveBeenCalledWith([], 'Schedule');
        });

        it('should use default calendar name when no league name provided', async () => {
            const { createICSContent } = await import('@/utils/ics.util');

            exportPodScheduleToICS(mockSchedule, mockTeamNames);

            expect(createICSContent).toHaveBeenCalledWith(
                expect.any(Array),
                'Schedule'
            );
        });
    });
});