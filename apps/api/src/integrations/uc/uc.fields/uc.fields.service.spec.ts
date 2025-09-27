import { Test, TestingModule } from '@nestjs/testing';
import { UCFieldsService } from './uc.fields.service';
import { UCClient } from '../uc.client';
import { UCFieldsResponse } from '../types/fields';

describe('UCFieldsService', () => {
  let service: UCFieldsService;
  let mockUCClient: jest.Mocked<UCClient>;

  beforeEach(async () => {
    mockUCClient = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UCFieldsService,
        { provide: UCClient, useValue: mockUCClient },
      ],
    }).compile();

    service = module.get<UCFieldsService>(UCFieldsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('list', () => {
    it('should call UC client with correct parameters', async () => {
      const mockResponse: UCFieldsResponse = {
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

      mockUCClient.get.mockResolvedValue(mockResponse);

      const params = { event_id: 169113 };
      const result = await service.list(params);

      expect(mockUCClient.get).toHaveBeenCalledWith('/api/fields', { event_id: 169113 });
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty parameters', async () => {
      const mockResponse: UCFieldsResponse = {
        action: 'api_fields_list',
        status: 200,
        count: 0,
        result: [],
        errors: [],
      };

      mockUCClient.get.mockResolvedValue(mockResponse);

      const result = await service.list({});

      expect(mockUCClient.get).toHaveBeenCalledWith('/api/fields', undefined);
      expect(result).toEqual(mockResponse);
    });
  });
});