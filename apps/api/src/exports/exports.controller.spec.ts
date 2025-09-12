/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';

describe('ExportsController', () => {
  let controller: ExportsController;

  const svcMock = {
    toCsv: jest.fn(),
    toIcs: jest.fn(),
  };

  // simple express Response mock
  const makeRes = () => {
    const res: any = {
      setHeader: jest.fn(),
      send: jest.fn((payload) => payload), // return sent payload so controller method returns it
    };
    return res;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportsController],
      providers: [{ provide: ExportsService, useValue: svcMock }],
    }).compile();

    controller = module.get<ExportsController>(ExportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /schedule/csv', () => {
    it('calls ExportsService.toCsv with rows, sets header, and returns CSV', () => {
      const rows = [{ id: 1, name: 'A' }];
      const csv = 'id,name\n1,A\n';
      svcMock.toCsv.mockReturnValueOnce(csv);

      const res = makeRes();
      const out = controller.csv({ rows }, res);

      expect(svcMock.toCsv).toHaveBeenCalledWith(rows);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.send).toHaveBeenCalledWith(csv);
      expect(out).toBe(csv);
    });

    it('handles missing rows by passing [] and returning empty string', () => {
      svcMock.toCsv.mockReturnValueOnce('');

      const res = makeRes();
      const out = controller.csv({} as any, res);

      expect(svcMock.toCsv).toHaveBeenCalledWith([]);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.send).toHaveBeenCalledWith('');
      expect(out).toBe('');
    });
  });

  describe('POST /schedule/ics', () => {
    it('converts start strings to Date, calls ExportsService.toIcs, sets header, and returns ICS', () => {
      const body = {
        events: [
          {
            title: 'Game',
            start: '2025-06-01T22:00:00.000Z',
            durationMins: 60,
            location: 'Field 1',
          },
        ],
      };
      const ics = 'BEGIN:VCALENDAR\nEND:VCALENDAR';
      svcMock.toIcs.mockReturnValueOnce(ics);

      const res = makeRes();
      const out = controller.ics(body as any, res);

      // verify mapping to Date
      expect(svcMock.toIcs).toHaveBeenCalledTimes(1);
      const [passedEvents] = svcMock.toIcs.mock.calls[0];
      expect(Array.isArray(passedEvents)).toBe(true);
      expect(passedEvents[0]).toEqual(
        expect.objectContaining({
          title: 'Game',
          durationMins: 60,
          location: 'Field 1',
        }),
      );
      // start is a Date equal to provided string
      expect(passedEvents[0].start).toBeInstanceOf(Date);
      expect(passedEvents[0].start.getTime()).toBe(
        new Date('2025-06-01T22:00:00.000Z').getTime(),
      );

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/calendar',
      );
      expect(res.send).toHaveBeenCalledWith(ics);
      expect(out).toBe(ics);
    });

    it('handles missing events by passing [] and returning empty ICS', () => {
      svcMock.toIcs.mockReturnValueOnce('');

      const res = makeRes();
      const out = controller.ics({} as any, res);

      expect(svcMock.toIcs).toHaveBeenCalledWith([]);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/calendar',
      );
      expect(res.send).toHaveBeenCalledWith('');
      expect(out).toBe('');
    });
  });
});
