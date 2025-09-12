/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';

// ---- Mock ics BEFORE importing the service ----
const createEventsMock = jest.fn();
jest.mock('ics', () => ({
  __esModule: true,
  createEvents: (...args: any[]) => createEventsMock(...args),
}));

import { ExportsService } from './exports.service';

describe('ExportsService', () => {
  let service: ExportsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportsService],
    }).compile();

    service = module.get<ExportsService>(ExportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('toCsv', () => {
    it('returns empty string for empty rows', () => {
      expect(service.toCsv([])).toBe('');
    });

    it('uses keys of the first row as headers, fills missing as empty string, and JSON-stringifies values', () => {
      const rows = [
        { id: 1, name: 'Alice, Inc.', note: 'He said "Hello"' },
        { id: 2, name: 'Bob', note: '', ignored: 'X' }, // "ignored" not in headers
      ];

      const csv = service.toCsv(rows);

      // Expect:
      // headers: id,name,note
      // row1:   1,"Alice, Inc.","He said \"Hello\""
      // row2:   2,"Bob",null
      // + trailing newline
      const expected =
        'id,name,note\n' +
        '1,"Alice, Inc.","He said \\"Hello\\""\n' +
        '2,"Bob",""\n';

      expect(csv).toBe(expected);
    });

    it('appends a trailing newline', () => {
      const csv = service.toCsv([{ a: 'x' }]);
      expect(csv.endsWith('\n')).toBe(true);
    });
  });

  describe('toIcs', () => {
    it('maps events to ics format and returns the ICS string', () => {
      // Mock success response from ics
      createEventsMock.mockReturnValueOnce({
        value: 'ICS_DATA',
        error: undefined,
      });

      const events = [
        {
          title: 'Game 1',
          start: new Date(2025, 0, 15, 9, 30), // Jan=0 => should map month+1
          durationMins: 60,
          location: 'Field A',
        },
        {
          title: 'Game 2',
          start: new Date(2025, 5, 1, 18, 0), // Jun=5 => month+1 = 6
          durationMins: 90,
        },
      ];

      const out = service.toIcs(events);
      expect(out).toBe('ICS_DATA');

      // Verify mapping passed into createEvents
      expect(createEventsMock).toHaveBeenCalledTimes(1);
      const [mapped] = createEventsMock.mock.calls[0];
      expect(mapped).toEqual([
        {
          title: 'Game 1',
          start: [2025, 1, 15, 9, 30],
          duration: { minutes: 60 },
          location: 'Field A',
        },
        {
          title: 'Game 2',
          start: [2025, 6, 1, 18, 0],
          duration: { minutes: 90 },
          location: undefined,
        },
      ]);
    });

    it('throws when ics.createEvents returns an error', () => {
      createEventsMock.mockReturnValueOnce({
        value: undefined,
        error: new Error('Bad ICS'),
      });

      expect(() =>
        service.toIcs([
          { title: 'X', start: new Date(2025, 0, 1, 0, 0), durationMins: 30 },
        ]),
      ).toThrow('Bad ICS');
    });

    it('returns empty string when ics returns no value and no error', () => {
      createEventsMock.mockReturnValueOnce({
        value: undefined,
        error: undefined,
      });

      const out = service.toIcs([
        { title: 'Y', start: new Date(2025, 0, 1, 0, 0), durationMins: 45 },
      ]);
      expect(out).toBe('');
    });
  });
});
