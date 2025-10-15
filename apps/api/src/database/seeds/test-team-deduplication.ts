import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { TeamsService, ExternalTeamData } from '../../teams/teams.service';
import { Team, UserTeamMembership, ExternalTeamSource } from '../entities';

/**
 * Test script to verify team deduplication works correctly with multiple users.
 *
 * Scenario:
 * 1. Create two test users (Alice and Bob)
 * 2. Import the same UC team for Alice (should create new team)
 * 3. Import the same UC team for Bob (should reuse existing team)
 * 4. Verify only one canonical team exists
 * 5. Verify both users are linked to the same team
 */

async function main() {
  await AppDataSource.initialize();

  const organizationId = '00000000-0000-0000-0000-000000000001';

  console.log('\n=== Team Deduplication Test ===\n');

  // Step 1: Create two test users
  console.log('Step 1: Creating test users...');

  const aliceResult = await AppDataSource.query<Array<{ id: string }>>(
    `INSERT INTO accounts (id, email)
     VALUES (gen_random_uuid(), $1)
     RETURNING id`,
    ['alice@test.com'],
  );
  const aliceId = aliceResult[0].id;
  console.log(`✓ Created Alice (${aliceId})`);

  const bobResult = await AppDataSource.query<Array<{ id: string }>>(
    `INSERT INTO accounts (id, email)
     VALUES (gen_random_uuid(), $1)
     RETURNING id`,
    ['bob@test.com'],
  );
  const bobId = bobResult[0].id;
  console.log(`✓ Created Bob (${bobId})`);

  // Step 2: Create TeamsService instance
  const teamsRepository = AppDataSource.getRepository(Team);
  const membershipsRepository = AppDataSource.getRepository(UserTeamMembership);
  const externalSourcesRepository =
    AppDataSource.getRepository(ExternalTeamSource);

  const teamsService = new TeamsService(
    teamsRepository,
    membershipsRepository,
    externalSourcesRepository,
  );

  // Step 3: Define a shared UC team
  const sharedUCTeam: ExternalTeamData = {
    externalId: '12345', // Same UC team ID
    source: 'ultimate_central',
    name: 'Vancouver Ultimate Warriors',
    location: 'Vancouver, BC',
    seasonStart: new Date('2024-06-01'),
    seasonEnd: new Date('2024-08-31'),
    colour: '#FF5722',
    altColour: '#FFFFFF',
    rawData: {
      ucTeamId: 12345,
      created_at: '2024-06-01T00:00:00Z',
    },
  };

  // Step 4: Import team for Alice (should create new team)
  console.log('\nStep 2: Importing UC team for Alice...');
  const aliceTeamId = await teamsService.importExternalTeam(
    aliceId,
    organizationId,
    sharedUCTeam,
  );
  console.log(`✓ Alice's team imported (canonical team_id: ${aliceTeamId})`);

  // Step 5: Import same team for Bob (should reuse existing team)
  console.log('\nStep 3: Importing same UC team for Bob...');
  const bobTeamId = await teamsService.importExternalTeam(
    bobId,
    organizationId,
    sharedUCTeam,
  );
  console.log(`✓ Bob's team imported (canonical team_id: ${bobTeamId})`);

  // Step 6: Verify deduplication worked
  console.log('\n=== Verification ===\n');

  // Check if both users got the same team_id
  if (aliceTeamId === bobTeamId) {
    console.log('✓ PASS: Both users linked to the same canonical team');
    console.log(`  Team ID: ${aliceTeamId}`);
  } else {
    console.log('✗ FAIL: Users linked to different teams!');
    console.log(`  Alice's team: ${aliceTeamId}`);
    console.log(`  Bob's team: ${bobTeamId}`);
  }

  // Count canonical teams for this external team
  const teamCount = await AppDataSource.query<Array<{ count: string }>>(
    `SELECT COUNT(*) as count
     FROM teams t
     JOIN external_team_sources ets ON ets."teamId" = t.id
     WHERE ets.source = $1 AND ets."externalId" = $2`,
    ['ultimate_central', '12345'],
  );
  const count = parseInt(teamCount[0].count, 10);

  if (count === 1) {
    console.log('✓ PASS: Only one canonical team created');
  } else {
    console.log(`✗ FAIL: Found ${count} canonical teams (expected 1)`);
  }

  // Verify both users have memberships
  const aliceMembership = await membershipsRepository.findOne({
    where: { userId: aliceId, teamId: aliceTeamId },
  });
  const bobMembership = await membershipsRepository.findOne({
    where: { userId: bobId, teamId: bobTeamId },
  });

  if (aliceMembership) {
    console.log('✓ PASS: Alice has membership to the team');
    console.log(
      `  Role: ${aliceMembership.role}, Joined via: ${aliceMembership.joinedVia}`,
    );
  } else {
    console.log('✗ FAIL: Alice missing membership');
  }

  if (bobMembership) {
    console.log('✓ PASS: Bob has membership to the team');
    console.log(
      `  Role: ${bobMembership.role}, Joined via: ${bobMembership.joinedVia}`,
    );
  } else {
    console.log('✗ FAIL: Bob missing membership');
  }

  // Count total memberships for this team
  const membershipCount = await AppDataSource.query<Array<{ count: string }>>(
    `SELECT COUNT(*) as count
     FROM user_team_memberships
     WHERE "teamId" = $1`,
    [aliceTeamId],
  );
  const totalMemberships = parseInt(membershipCount[0].count, 10);
  console.log(`\nTotal memberships for team: ${totalMemberships}`);

  // Get external source info
  const externalSource = await externalSourcesRepository.findOne({
    where: { teamId: aliceTeamId },
  });

  if (externalSource) {
    console.log('\n✓ External source record:');
    console.log(`  Source: ${externalSource.source}`);
    console.log(`  External ID: ${externalSource.externalId}`);
    console.log(`  Last synced: ${externalSource.lastSyncedAt?.toISOString()}`);
    console.log(`  Sync status: ${externalSource.syncStatus}`);
  }

  // Step 7: Test importing for Alice again (should be idempotent)
  console.log('\nStep 4: Re-importing for Alice (idempotency test)...');
  const aliceTeamId2 = await teamsService.importExternalTeam(
    aliceId,
    organizationId,
    sharedUCTeam,
  );

  if (aliceTeamId === aliceTeamId2) {
    console.log('✓ PASS: Re-import returned same team (idempotent)');
  } else {
    console.log('✗ FAIL: Re-import created different team!');
  }

  // Verify membership count didn't increase
  const membershipCount2 = await AppDataSource.query<Array<{ count: string }>>(
    `SELECT COUNT(*) as count
     FROM user_team_memberships
     WHERE "teamId" = $1`,
    [aliceTeamId],
  );
  const totalMemberships2 = parseInt(membershipCount2[0].count, 10);

  if (totalMemberships === totalMemberships2) {
    console.log('✓ PASS: No duplicate memberships created');
  } else {
    console.log(
      `✗ FAIL: Memberships increased from ${totalMemberships} to ${totalMemberships2}`,
    );
  }

  // Step 8: Clean up test data
  console.log('\n=== Cleanup ===\n');

  await AppDataSource.query(
    `DELETE FROM user_team_memberships WHERE "userId" IN ($1, $2)`,
    [aliceId, bobId],
  );
  console.log('✓ Deleted memberships');

  await AppDataSource.query(
    `DELETE FROM external_team_sources WHERE "teamId" = $1`,
    [aliceTeamId],
  );
  console.log('✓ Deleted external source');

  await AppDataSource.query(`DELETE FROM teams WHERE id = $1`, [aliceTeamId]);
  console.log('✓ Deleted team');

  await AppDataSource.query(`DELETE FROM accounts WHERE id IN ($1, $2)`, [
    aliceId,
    bobId,
  ]);
  console.log('✓ Deleted test users');

  console.log('\n=== Test Complete ===\n');

  await AppDataSource.destroy();
}

main().catch((error: unknown) => {
  console.error('\n✗ Test failed with error:');
  console.error(error);
  process.exit(1);
});
