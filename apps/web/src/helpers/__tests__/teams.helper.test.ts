import {
    getFirstTeamName,
    getSecondTeamName,
    getTeamDisplayName,
    getTeamColor
} from '../teams.helper';
import { TeamSide } from '@ultiverse/shared-types';

describe('teams.helper', () => {
    const mockTeamNames = {
        'team1': 'Thunder Bolts',
        'team2': 'Lightning Strikes',
        'pod1': 'Red Pod',
        'pod2': 'Blue Pod',
        'pod3': 'Green Pod'
    };

    const mockTeamData = {
        'team1': { id: 'team1', name: 'Thunder Bolts', colour: '#ff0000' },
        'team2': { id: 'team2', name: 'Lightning Strikes', colour: '#0000ff' }
    };

    describe('getFirstTeamName', () => {
        it('should return team name from pods array', () => {
            const teamSide: TeamSide = { pods: ['pod1', 'pod2'] };
            const result = getFirstTeamName(teamSide, mockTeamNames);
            expect(result).toBe('Red Pod');
        });

        it('should return fallback for unknown pod', () => {
            const teamSide: TeamSide = { pods: ['unknown-pod'] };
            const result = getFirstTeamName(teamSide, mockTeamNames);
            expect(result).toBe('Pod unknown-pod');
        });

        it('should return team name from teamId', () => {
            const teamSide: TeamSide = { teamId: 'team1' };
            const result = getFirstTeamName(teamSide, mockTeamNames);
            expect(result).toBe('Thunder Bolts');
        });

        it('should return fallback for unknown teamId', () => {
            const teamSide: TeamSide = { teamId: 'unknown-team' };
            const result = getFirstTeamName(teamSide, mockTeamNames);
            expect(result).toBe('Team unknown-team');
        });

        it('should return direct team name', () => {
            const teamSide: TeamSide = { teamName: 'Direct Team Name' };
            const result = getFirstTeamName(teamSide, mockTeamNames);
            expect(result).toBe('Direct Team Name');
        });

        it('should return Unknown for empty TeamSide', () => {
            const teamSide: TeamSide = {};
            const result = getFirstTeamName(teamSide, mockTeamNames);
            expect(result).toBe('Unknown');
        });

        it('should handle empty pods array', () => {
            const teamSide: TeamSide = { pods: [] };
            const result = getFirstTeamName(teamSide, mockTeamNames);
            expect(result).toBe('Unknown');
        });
    });

    describe('getSecondTeamName', () => {
        it('should return second team name from pods array', () => {
            const teamSide: TeamSide = { pods: ['pod1', 'pod2'] };
            const result = getSecondTeamName(teamSide, mockTeamNames);
            expect(result).toBe('Blue Pod');
        });

        it('should return fallback for unknown second pod', () => {
            const teamSide: TeamSide = { pods: ['pod1', 'unknown-pod'] };
            const result = getSecondTeamName(teamSide, mockTeamNames);
            expect(result).toBe('Pod unknown-pod');
        });

        it('should return empty string when only one pod', () => {
            const teamSide: TeamSide = { pods: ['pod1'] };
            const result = getSecondTeamName(teamSide, mockTeamNames);
            expect(result).toBe('');
        });

        it('should return empty string for non-pod TeamSide', () => {
            const teamSide: TeamSide = { teamId: 'team1' };
            const result = getSecondTeamName(teamSide, mockTeamNames);
            expect(result).toBe('');
        });

        it('should return empty string for empty pods array', () => {
            const teamSide: TeamSide = { pods: [] };
            const result = getSecondTeamName(teamSide, mockTeamNames);
            expect(result).toBe('');
        });
    });

    describe('getTeamDisplayName', () => {
        it('should return direct team name first', () => {
            const teamSide: TeamSide = { teamName: 'Direct Team' };
            const result = getTeamDisplayName(teamSide, mockTeamNames);
            expect(result).toBe('Direct Team');
        });

        it('should join multiple pod names with +', () => {
            const teamSide: TeamSide = { pods: ['pod1', 'pod2'] };
            const result = getTeamDisplayName(teamSide, mockTeamNames);
            expect(result).toBe('Red Pod + Blue Pod');
        });

        it('should handle single pod', () => {
            const teamSide: TeamSide = { pods: ['pod1'] };
            const result = getTeamDisplayName(teamSide, mockTeamNames);
            expect(result).toBe('Red Pod');
        });

        it('should use fallback for unknown pods', () => {
            const teamSide: TeamSide = { pods: ['unknown1', 'unknown2'] };
            const result = getTeamDisplayName(teamSide, mockTeamNames);
            expect(result).toBe('Pod unknown1 + Pod unknown2');
        });

        it('should return team name from teamId', () => {
            const teamSide: TeamSide = { teamId: 'team1' };
            const result = getTeamDisplayName(teamSide, mockTeamNames);
            expect(result).toBe('Thunder Bolts');
        });

        it('should use fallback for unknown teamId', () => {
            const teamSide: TeamSide = { teamId: 'unknown' };
            const result = getTeamDisplayName(teamSide, mockTeamNames);
            expect(result).toBe('Team unknown');
        });

        it('should return Unknown Team for empty TeamSide', () => {
            const teamSide: TeamSide = {};
            const result = getTeamDisplayName(teamSide, mockTeamNames);
            expect(result).toBe('Unknown Team');
        });

        it('should work without teamNames parameter', () => {
            const teamSide: TeamSide = { teamName: 'Direct Team' };
            const result = getTeamDisplayName(teamSide);
            expect(result).toBe('Direct Team');
        });
    });

    describe('getTeamColor', () => {
        it('should return black for pods', () => {
            const teamSide: TeamSide = { pods: ['pod1', 'pod2'] };
            const result = getTeamColor(teamSide, mockTeamData);
            expect(result).toBe('#000000');
        });

        it('should return team color from teamData', () => {
            const teamSide: TeamSide = { teamId: 'team1' };
            const result = getTeamColor(teamSide, mockTeamData);
            expect(result).toBe('#ff0000');
        });

        it('should return black for unknown teamId', () => {
            const teamSide: TeamSide = { teamId: 'unknown' };
            const result = getTeamColor(teamSide, mockTeamData);
            expect(result).toBe('#000000');
        });

        it('should return black for empty TeamSide', () => {
            const teamSide: TeamSide = {};
            const result = getTeamColor(teamSide, mockTeamData);
            expect(result).toBe('#000000');
        });

        it('should work without teamData parameter', () => {
            const teamSide: TeamSide = { teamId: 'team1' };
            const result = getTeamColor(teamSide);
            expect(result).toBe('#000000');
        });
    });
});