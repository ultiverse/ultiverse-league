import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateProviderTypeToShortForm1764358568984
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get schema from connection configuration
    const schema = (
      queryRunner.connection.driver.options as { schema?: string }
    ).schema;
    const schemaPrefix = schema ? `"${schema}".` : '';

    // Update teams.sourceType from 'ultimate_central' to 'uc'
    await queryRunner.query(`
      UPDATE ${schemaPrefix}teams
      SET "sourceType" = 'uc'
      WHERE "sourceType" = 'ultimate_central'
    `);

    // Update leagues.sourceType from 'ultimate_central' to 'uc'
    await queryRunner.query(`
      UPDATE ${schemaPrefix}leagues
      SET "sourceType" = 'uc'
      WHERE "sourceType" = 'ultimate_central'
    `);

    // Update external_league_sources.provider from 'ultimate_central' to 'uc'
    await queryRunner.query(`
      UPDATE ${schemaPrefix}external_league_sources
      SET "provider" = 'uc'
      WHERE "provider" = 'ultimate_central'
    `);

    // Update external_team_sources.source from 'ultimate_central' to 'uc'
    await queryRunner.query(`
      UPDATE ${schemaPrefix}external_team_sources
      SET "source" = 'uc'
      WHERE "source" = 'ultimate_central'
    `);

    // Update external_player_sources.provider from 'ultimate_central' to 'uc'
    await queryRunner.query(`
      UPDATE ${schemaPrefix}external_player_sources
      SET "provider" = 'uc'
      WHERE "provider" = 'ultimate_central'
    `);

    // Update external_game_sources.source from 'ultimate_central' to 'uc'
    await queryRunner.query(`
      UPDATE ${schemaPrefix}external_game_sources
      SET "source" = 'uc'
      WHERE "source" = 'ultimate_central'
    `);

    // Update integration_connections.provider from 'ultimate_central' to 'uc'
    await queryRunner.query(`
      UPDATE ${schemaPrefix}integration_connections
      SET "provider" = 'uc'
      WHERE "provider" = 'ultimate_central'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get schema from connection configuration
    const schema = (
      queryRunner.connection.driver.options as { schema?: string }
    ).schema;
    const schemaPrefix = schema ? `"${schema}".` : '';

    // Revert all changes back to 'ultimate_central'
    await queryRunner.query(`
      UPDATE ${schemaPrefix}teams
      SET "sourceType" = 'ultimate_central'
      WHERE "sourceType" = 'uc'
    `);

    await queryRunner.query(`
      UPDATE ${schemaPrefix}leagues
      SET "sourceType" = 'ultimate_central'
      WHERE "sourceType" = 'uc'
    `);

    await queryRunner.query(`
      UPDATE ${schemaPrefix}external_league_sources
      SET "provider" = 'ultimate_central'
      WHERE "provider" = 'uc'
    `);

    await queryRunner.query(`
      UPDATE ${schemaPrefix}external_team_sources
      SET "source" = 'ultimate_central'
      WHERE "source" = 'uc'
    `);

    await queryRunner.query(`
      UPDATE ${schemaPrefix}external_player_sources
      SET "provider" = 'ultimate_central'
      WHERE "provider" = 'uc'
    `);

    await queryRunner.query(`
      UPDATE ${schemaPrefix}external_game_sources
      SET "source" = 'ultimate_central'
      WHERE "source" = 'uc'
    `);

    await queryRunner.query(`
      UPDATE ${schemaPrefix}integration_connections
      SET "provider" = 'ultimate_central'
      WHERE "provider" = 'uc'
    `);
  }
}
