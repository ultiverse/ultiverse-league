import { Test, TestingModule } from '@nestjs/testing';
import { FieldsController } from './fields.controller';
import { FieldsService } from './fields.service';
import { Field } from '../domain/models';

describe('FieldsController', () => {
  let controller: FieldsController;
  let mockFieldsService: {
    getFieldsByEventId: jest.Mock<Promise<Field[]>, [number]>;
  };

  beforeEach(async () => {
    mockFieldsService = {
      getFieldsByEventId: jest.fn<Promise<Field[]>, [number]>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FieldsController],
      providers: [{ provide: FieldsService, useValue: mockFieldsService }],
    }).compile();

    controller = module.get<FieldsController>(FieldsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFields', () => {
    it('should return fields for given event_id', async () => {
      const mockFields: Field[] = [
        {
          id: 'venue-1495-bowring-park',
          name: 'Bowring Park',
          venue: 'Bowring Park',
          subfields: [
            {
              id: '124129',
              name: 'Bowring Park - Jamie Morry Soccer Pitch',
              surface: 'grass',
              externalRefs: {
                uc: {
                  eventId: 169113,
                  orgId: 1495,
                  slug: 'bowring-park-jamie-morry-soccer-pitch',
                },
              },
              meta: {
                contactPhone: '',
              },
            },
          ],
          map: 'https://maps.app.goo.gl/4g7hp6suyq1kkpny9',
          surface: 'grass',
          externalRefs: {
            uc: {
              orgId: 1495,
              eventId: 169113,
            },
          },
          meta: {
            fieldCount: 1,
          },
        },
      ];

      mockFieldsService.getFieldsByEventId.mockResolvedValue(mockFields);

      const result = await controller.getFields(169113);

      expect(mockFieldsService.getFieldsByEventId).toHaveBeenCalledWith(169113);
      expect(result).toEqual(mockFields);
    });
  });
});
