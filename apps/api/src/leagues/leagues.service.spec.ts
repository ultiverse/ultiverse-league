import { Test, TestingModule } from '@nestjs/testing';
import { LeaguesService } from './leagues.service';
import { LEAGUE_REPO } from './ports/league.repository';

describe('LeaguesService', () => {
  let service: LeaguesService;

  const repoMock = {
    findLatest: jest.fn(),
    findRecent: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [LeaguesService, { provide: LEAGUE_REPO, useValue: repoMock }],
    }).compile();

    service = module.get<LeaguesService>(LeaguesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('latest()', () => {
    it('returns the latest league when repo has one', async () => {
      repoMock.findLatest.mockResolvedValueOnce({ id: 'L9', name: 'Newest' });
      await expect(service.latest()).resolves.toEqual({
        id: 'L9',
        name: 'Newest',
      });
      expect(repoMock.findLatest).toHaveBeenCalledTimes(1);
    });

    it('returns null when repo has none', async () => {
      repoMock.findLatest.mockResolvedValueOnce(null);
      await expect(service.latest()).resolves.toBeNull();
    });
  });

  describe('recent(limit?)', () => {
    it('passes default limit=10 to repo', async () => {
      const rows = Array.from({ length: 3 }, (_, i) => ({ id: `L${i + 1}` }));
      repoMock.findRecent.mockResolvedValueOnce(rows);

      await expect(service.recent()).resolves.toEqual(rows);
      expect(repoMock.findRecent).toHaveBeenCalledWith(10);
    });

    it('passes provided limit through to repo', async () => {
      const rows = [{ id: 'L1' }, { id: 'L2' }];
      repoMock.findRecent.mockResolvedValueOnce(rows);

      await expect(service.recent(2)).resolves.toEqual(rows);
      expect(repoMock.findRecent).toHaveBeenCalledWith(2);
    });
  });

  describe('get(id)', () => {
    it('returns the league when found', async () => {
      repoMock.findById.mockResolvedValueOnce({ id: 'L3', name: 'Beta' });
      await expect(service.get('L3')).resolves.toEqual({
        id: 'L3',
        name: 'Beta',
      });
      expect(repoMock.findById).toHaveBeenCalledWith('L3');
    });

    it('returns null when not found', async () => {
      repoMock.findById.mockResolvedValueOnce(null);
      await expect(service.get('missing')).resolves.toBeNull();
    });
  });
});
