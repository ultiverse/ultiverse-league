import { Test, TestingModule } from '@nestjs/testing';
import { UCController } from './uc.controller';

import { UCClient } from './uc.client';
import { UCEventsService } from './uc.events/uc.events.service';
import { UCRegistrationsService } from './uc.registrations/uc.registrations.service';
import { UCTeamsService } from './uc.teams/uc.teams.service';

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

  const teamsMock = {
    list: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UCController],
      providers: [
        { provide: UCClient, useValue: clientMock },
        { provide: UCEventsService, useValue: eventsMock },
        { provide: UCRegistrationsService, useValue: regsMock },
        { provide: UCTeamsService, useValue: teamsMock },
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

    it('omits type when invalid type provided but includes start as date string', async () => {
      eventsMock.list.mockResolvedValueOnce({ ok: true });

      await controller.getEvents(
        'invalid_type',
        'date_desc',
        '7',
        'invalid_start',
      );

      expect(eventsMock.list).toHaveBeenCalledWith({
        // no 'type' because invalid_type is not in UC_EVENT_TYPES
        order_by: 'date_desc',
        site_id: 7,
        start: 'invalid_start', // accepted as UCDateString
      });
    });

    it('ignores order_by when not in allow-list', async () => {
      eventsMock.list.mockResolvedValueOnce({ ok: 1 });

      await controller.getEvents('league', 'not_valid', undefined, undefined);

      expect(eventsMock.list).toHaveBeenCalledWith({
        type: ['league'],
        // no order_by because not_valid is not in UC_EVENT_ORDER_BY
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
