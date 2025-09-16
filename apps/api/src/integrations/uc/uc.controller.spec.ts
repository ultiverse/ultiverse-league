/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Test, TestingModule } from '@nestjs/testing';
import { UCController } from './uc.controller';

import { UCClient } from './uc.client';
import { UCEventsService } from './uc.events/uc.events.service';
import { UCRegistrationsService } from './uc.registrations/uc.registrations.service';

// ---- Mock types/common so we control parsing + allow-lists ----
const parseCsvEnum = jest.fn();
const parseOptionalInt = jest.fn();
const parseStart = jest.fn();

jest.mock('./types/common', () => ({
  __esModule: true,
  // allow-list constants used by the controller for validation
  UC_EVENT_TYPES: ['league', 'tournament', 'practice'],
  UC_EVENT_ORDER_BY: ['date_desc', 'date_asc', 'name_asc', 'start_date_asc'],
  // parsers we can steer per-test
  parseCsvEnum: (...args: any[]) => parseCsvEnum(...args),
  parseOptionalInt: (...args: any[]) => parseOptionalInt(...args),
  parseStart: (...args: any[]) => parseStart(...args),
}));

describe('UCController', () => {
  let controller: UCController;

  const clientMock = {
    get: jest.fn(),
    post: jest.fn(),
  };

  const eventsMock = {
    list: jest.fn(),
    getById: jest.fn(),
  };

  const regsMock = {
    list: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    parseCsvEnum.mockReset();
    parseOptionalInt.mockReset();
    parseStart.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UCController],
      providers: [
        { provide: UCClient, useValue: clientMock },
        { provide: UCEventsService, useValue: eventsMock },
        { provide: UCRegistrationsService, useValue: regsMock },
      ],
    }).compile();

    controller = module.get<UCController>(UCController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /uc/me', () => {
    it('calls UCClient.get("/api/me") and returns the result', async () => {
      clientMock.get.mockResolvedValueOnce({ id: 1, name: 'Agent Smith' });
      const res = await controller.me();
      expect(res).toEqual({ id: 1, name: 'Agent Smith' });
      expect(clientMock.get).toHaveBeenCalledTimes(1);
      expect(clientMock.get).toHaveBeenCalledWith('/api/me');
    });
  });

  describe('GET /uc/events', () => {
    it('builds EventsQuery using parsers and forwards to UCEventsService.list', async () => {
      // parse inputs -> controller should include all of these
      parseCsvEnum.mockReturnValueOnce(['league', 'tournament']); // type
      parseOptionalInt.mockReturnValueOnce(42); // site_id
      parseStart.mockReturnValueOnce('next_7_days'); // start enum

      eventsMock.list.mockResolvedValueOnce({ result: [] });

      const out = await controller.getEvents(
        'league,tournament', // typeCSV
        'name_asc', // order_by
        '42', // site_id
        'next_7_days', // start
      );

      expect(out).toEqual({ result: [] });
      expect(eventsMock.list).toHaveBeenCalledTimes(1);
      expect(eventsMock.list).toHaveBeenCalledWith({
        type: ['league', 'tournament'],
        order_by: 'name_asc',
        site_id: 42,
        start: 'next_7_days',
      });
    });

    it('omits type when parseCsvEnum returns an empty list', async () => {
      parseCsvEnum.mockReturnValueOnce([]); // typeCSV -> []
      parseOptionalInt.mockReturnValueOnce(7); // site_id -> 7
      parseStart.mockReturnValueOnce(undefined); // start -> undefined (omit)

      eventsMock.list.mockResolvedValueOnce({ ok: true });

      await controller.getEvents('practice', 'date_desc', '7', 'bogus');

      expect(eventsMock.list).toHaveBeenCalledWith({
        // no 'type'
        order_by: 'date_desc',
        site_id: 7,
        // no 'start'
      });
    });

    it('ignores order_by when not in allow-list', async () => {
      parseCsvEnum.mockReturnValueOnce(['practice']);
      parseOptionalInt.mockReturnValueOnce(undefined);
      parseStart.mockReturnValueOnce(undefined);

      eventsMock.list.mockResolvedValueOnce({ ok: 1 });

      await controller.getEvents('practice', 'not_valid', undefined, undefined);

      expect(eventsMock.list).toHaveBeenCalledWith({
        type: ['practice'],
        // no order_by
      });
    });
  });

  describe('GET /uc/events/:id', () => {
    it('returns the single event when found', async () => {
      eventsMock.getById.mockResolvedValueOnce({ id: 99, name: 'Thing' });
      const res = await controller.eventById(99);
      expect(res).toEqual({ id: 99, name: 'Thing' });
      expect(eventsMock.getById).toHaveBeenCalledWith(99);
    });

    it('returns a 404 payload when not found', async () => {
      eventsMock.getById.mockResolvedValueOnce(null);
      const res = await controller.eventById(123);
      expect(res).toEqual({ status: 404, message: 'Not found' });
    });
  });

  describe('GET /uc/registrations', () => {
    it('defaults includePerson to true when omitted', async () => {
      regsMock.list.mockResolvedValueOnce({ result: [{ id: 1 }] });
      const res = await controller.registrations(777, undefined);
      expect(res).toEqual({ result: [{ id: 1 }] });
      expect(regsMock.list).toHaveBeenCalledWith(777, true);
    });

    it('treats includePerson!="false" as true', async () => {
      regsMock.list.mockResolvedValueOnce({ result: [] });
      await controller.registrations(888, '0'); // any string not exactly 'false'
      expect(regsMock.list).toHaveBeenCalledWith(888, true);
    });

    it('passes includePerson=false only when the literal "false" is provided', async () => {
      regsMock.list.mockResolvedValueOnce({ result: [] });
      await controller.registrations(999, 'false');
      expect(regsMock.list).toHaveBeenCalledWith(999, false);
    });
  });
});
