import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TeamsController } from './teams.controller';
import { Team, Membership } from '../database/entities';

describe('TeamsController', () => {
  let controller: TeamsController;

  const mockTeamRepository = {
    findOne: jest.fn(),
  };

  const mockMembershipRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        {
          provide: getRepositoryToken(Team),
          useValue: mockTeamRepository,
        },
        {
          provide: getRepositoryToken(Membership),
          useValue: mockMembershipRepository,
        },
      ],
    }).compile();

    controller = module.get<TeamsController>(TeamsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
