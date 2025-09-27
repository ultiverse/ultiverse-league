import { Test, TestingModule } from '@nestjs/testing';
import { FieldsService } from './fields.service';
import { UCFieldsService } from '../integrations/uc/uc.fields/uc.fields.service';
import { UCFieldsResponse } from '../integrations/uc/types/fields';

describe('FieldsService', () => {
  let service: FieldsService;
  let mockUCFieldsService: jest.Mocked<UCFieldsService>;

  beforeEach(async () => {
    mockUCFieldsService = {
      list: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FieldsService,
        { provide: UCFieldsService, useValue: mockUCFieldsService },
      ],
    }).compile();

    service = module.get<FieldsService>(FieldsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFieldsByEventId', () => {
    it('should transform UC fields to domain fields grouped by venue', async () => {
      const mockUCResponse: UCFieldsResponse = {
        action: 'api_fields_list',
        status: 200,
        count: 2,
        result: [
          {
            model: 'field',
            id: 124129,
            name: 'Bowring Park - Jamie Morry Soccer Pitch',
            surface: 'grass',
            page_id: 1642103,
            location_id: 1026955,
            organization_id: 1495,
            media_item_id: null,
            contact_phone_number: '',
            website_url: 'https://maps.app.goo.gl/4g7hp6suyq1kkpny9',
            slug: 'bowring-park-jamie-morry-soccer-pitch',
          },
          {
            model: 'field',
            id: 122985,
            name: 'Jamie Morrey Field',
            surface: 'grass',
            page_id: 1523714,
            location_id: 952906,
            organization_id: 10083,
            media_item_id: 458447,
            contact_phone_number: '',
            website_url: 'https://bowringpark.com/maps/',
            slug: 'jamie-morrey-field',
          },
        ],
        errors: [],
      };

      mockUCFieldsService.list.mockResolvedValue(mockUCResponse);

      const result = await service.getFieldsByEventId(169113);

      expect(mockUCFieldsService.list).toHaveBeenCalledWith({ event_id: 169113 });
      expect(result).toHaveLength(2); // Two different venues

      // Check first venue (Bowring Park)
      const bowringPark = result.find(f => f.name === 'Bowring Park');
      expect(bowringPark).toBeDefined();
      expect(bowringPark!.venue).toBe('Bowring Park');
      expect(bowringPark!.subfields).toHaveLength(1);
      expect(bowringPark!.subfields[0].name).toBe('Bowring Park - Jamie Morry Soccer Pitch');
      expect(bowringPark!.map).toBe('https://maps.app.goo.gl/4g7hp6suyq1kkpny9');
      expect(bowringPark!.surface).toBe('grass');

      // Check second venue (Jamie Morrey Field - should be treated as its own venue)
      const jamieMorrey = result.find(f => f.name === 'Jamie Morrey Field');
      expect(jamieMorrey).toBeDefined();
      expect(jamieMorrey!.venue).toBe('Jamie Morrey Field');
      expect(jamieMorrey!.subfields).toHaveLength(1);
      expect(jamieMorrey!.subfields[0].name).toBe('Jamie Morrey Field');
    });

    it('should handle empty UC response', async () => {
      const mockUCResponse: UCFieldsResponse = {
        action: 'api_fields_list',
        status: 200,
        count: 0,
        result: [],
        errors: [],
      };

      mockUCFieldsService.list.mockResolvedValue(mockUCResponse);

      const result = await service.getFieldsByEventId(169113);

      expect(result).toEqual([]);
    });

    it('should group fields with similar venue names', async () => {
      const mockUCResponse: UCFieldsResponse = {
        action: 'api_fields_list',
        status: 200,
        count: 2,
        result: [
          {
            model: 'field',
            id: 1,
            name: 'Central Park - Field 1',
            surface: 'grass',
            organization_id: 100,
            location_id: 1000,
          },
          {
            model: 'field',
            id: 2,
            name: 'Central Park - Field 2',
            surface: 'grass',
            organization_id: 100,
            location_id: 1000,
          },
        ] as any,
        errors: [],
      };

      mockUCFieldsService.list.mockResolvedValue(mockUCResponse);

      const result = await service.getFieldsByEventId(169113);

      expect(result).toHaveLength(1); // Should be grouped into one venue
      expect(result[0].name).toBe('Central Park');
      expect(result[0].subfields).toHaveLength(2);
      expect(result[0].subfields[0].name).toBe('Central Park - Field 1');
      expect(result[0].subfields[1].name).toBe('Central Park - Field 2');
    });
  });
});