import 'reflect-metadata';
import { AppDataSource } from '../data-source';

async function main() {
  await AppDataSource.initialize();

  // Get greg's account
  const [account] = await AppDataSource.query(
    `SELECT id FROM accounts WHERE email = $1`,
    ['greg@gregpike.ca'],
  );

  if (!account) {
    console.error('Account not found for greg@gregpike.ca');
    process.exit(1);
  }

  const accountId = account.id;
  console.log('Found account:', accountId);

  // Organization ID (hardcoded as 1 for now)
  const organizationId = '00000000-0000-0000-0000-000000000001';

  // Create a few sample teams
  const teams = [
    {
      name: 'Summer League Warriors',
      location: 'Vancouver, BC',
      seasonStart: '2024-06-01',
      seasonEnd: '2024-08-31',
      colour: '#FF5722',
      altColour: '#FFFFFF',
    },
    {
      name: 'Spring Mixed Champions',
      location: 'Toronto, ON',
      seasonStart: '2024-03-01',
      seasonEnd: '2024-05-31',
      colour: '#2196F3',
      altColour: '#FFC107',
    },
    {
      name: 'Fall Ultimate All-Stars',
      location: 'Montreal, QC',
      seasonStart: '2023-09-01',
      seasonEnd: '2023-11-30',
      colour: '#4CAF50',
      altColour: '#000000',
    },
  ];

  for (const team of teams) {
    // Insert team (using camelCase columns as TypeORM created them)
    const [insertedTeam] = await AppDataSource.query(
      `
      INSERT INTO teams (
        id, "organizationId", name, location, "seasonStart", "seasonEnd",
        "createdByUserId", "sourceType", "isEditable", colour, "altColour"
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'ultiverse', true, $7, $8
      )
      RETURNING id;
      `,
      [
        organizationId,
        team.name,
        team.location,
        team.seasonStart,
        team.seasonEnd,
        accountId,
        team.colour,
        team.altColour,
      ],
    );

    const teamId = insertedTeam.id;

    // Create user-team membership (using camelCase)
    await AppDataSource.query(
      `
      INSERT INTO user_team_memberships (
        id, "userId", "teamId", role, "joinedVia"
      )
      VALUES (
        gen_random_uuid(), $1, $2, 'player', 'manual'
      )
      ON CONFLICT ("userId", "teamId") DO NOTHING;
      `,
      [accountId, teamId],
    );

    console.log(`Created team: ${team.name} (${teamId})`);
  }

  console.log('\nSeeded teams successfully!');
  await AppDataSource.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
