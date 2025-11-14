import { INestApplication, Logger, RequestMethod } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { In, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Organization, Account, League } from '../src/database/entities';

describe('Leagues security boundary (e2e)', () => {
  let app: INestApplication;
  let orgRepo: Repository<Organization>;
  let accountRepo: Repository<Account>;
  let leagueRepo: Repository<League>;
  const createdLeagueIds: string[] = [];
  const createdAccountIds: string[] = [];
  const createdOrganizationIds: string[] = [];

  const aliceEmail = 'alice-security@orga.test';
  const bobEmail = 'bob-security@orgb.test';
  const charlieEmail = 'charlie-security@test.local';

  const getServer = () =>
    app.getHttpServer() as Parameters<typeof request>[0];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1', {
      exclude: [{ path: 'health', method: RequestMethod.GET }],
    });
    await app.init();

    orgRepo = app.get<Repository<Organization>>(getRepositoryToken(Organization));
    accountRepo = app.get<Repository<Account>>(getRepositoryToken(Account));
    leagueRepo = app.get<Repository<League>>(getRepositoryToken(League));
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    if (createdLeagueIds.length > 0) {
      await leagueRepo.delete({ id: In(createdLeagueIds) });
      createdLeagueIds.length = 0;
    }
    if (createdAccountIds.length > 0) {
      await accountRepo.delete({ id: In(createdAccountIds) });
      createdAccountIds.length = 0;
    }
    if (createdOrganizationIds.length > 0) {
      await orgRepo.delete({ id: In(createdOrganizationIds) });
      createdOrganizationIds.length = 0;
    }
  });

  const createOrgAccountLeague = async ({
    organizationName,
    accountEmail,
    leagueName,
  }: {
    organizationName: string;
    accountEmail: string;
    leagueName: string;
  }) => {
    const organization = await orgRepo.save(
      orgRepo.create({ name: organizationName }),
    );

    const account = await accountRepo.save(
      accountRepo.create({
        email: accountEmail,
        organizationId: organization.id,
        status: 'active',
      }),
    );

    const league = await leagueRepo.save(
      leagueRepo.create({
        organizationId: organization.id,
        name: leagueName,
        sourceType: 'ultiverse',
        isEditable: true,
        visibility: 'public',
        seasonStart: new Date('2025-06-01'),
        seasonEnd: new Date('2025-08-31'),
      }),
    );

    createdOrganizationIds.push(organization.id);
    createdAccountIds.push(account.id);
    createdLeagueIds.push(league.id);

    return { organization, account, league };
  };

  it('returns leagues only from requesting user organization', async () => {
    const { league: summerLeague } = await createOrgAccountLeague({
      organizationName: 'Org A',
      accountEmail: aliceEmail,
      leagueName: 'Summer League',
    });
    const { league: winterLeague } = await createOrgAccountLeague({
      organizationName: 'Org B',
      accountEmail: bobEmail,
      leagueName: 'Winter League',
    });

    const aliceResponse = await request(getServer())
      .get('/api/v1/leagues')
      .set('X-User-Email', aliceEmail)
      .expect(200);

    expect(aliceResponse.body).toHaveLength(1);
    expect(aliceResponse.body[0].id).toBe(summerLeague.id);
    expect(aliceResponse.body[0].name).toBe('Summer League');

    const bobResponse = await request(getServer())
      .get('/api/v1/leagues')
      .set('X-User-Email', bobEmail)
      .expect(200);

    expect(bobResponse.body).toHaveLength(1);
    expect(bobResponse.body[0].id).toBe(winterLeague.id);
    expect(bobResponse.body[0].name).toBe('Winter League');
  });

  it('returns empty array and warns when account lacks organizationId', async () => {
    const account = await accountRepo.save(
      accountRepo.create({
        email: charlieEmail,
        organizationId: null,
        status: 'active',
      }),
    );
    createdAccountIds.push(account.id);

    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    const res = await request(getServer())
      .get('/api/v1/leagues')
      .set('X-User-Email', charlieEmail)
      .expect(200);

    expect(res.body).toEqual([]);
    expect(
      warnSpy.mock.calls.some((args) =>
        args[0]?.includes('has no organization assigned'),
      ),
    ).toBe(true);

    warnSpy.mockRestore();
  });

  it('returns empty array and warns when email header missing', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    const res = await request(getServer()).get('/api/v1/leagues').expect(200);

    expect(res.body).toEqual([]);
    expect(
      warnSpy.mock.calls.some((args) =>
        args[0]?.includes('No user email provided'),
      ),
    ).toBe(true);

    warnSpy.mockRestore();
  });
});
