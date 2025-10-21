import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLeagues1760481000000 implements MigrationInterface {
  name = 'CreateLeagues1760481000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get schema from connection configuration
    const schema = (queryRunner.connection.driver.options as { schema?: string })
      .schema;
    const schemaPrefix = schema ? `"${schema}".` : '';

    // Create leagues table
    await queryRunner.query(`
      CREATE TABLE ${schemaPrefix}leagues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES ${schemaPrefix}organizations(id),
        name TEXT NOT NULL,
        season_start DATE,
        season_end DATE,
        source_type TEXT NOT NULL DEFAULT 'ultiverse',
        is_editable BOOLEAN NOT NULL DEFAULT true,
        visibility TEXT DEFAULT 'public',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Add league_id to teams (nullable - teams can exist without leagues)
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}teams
        ADD COLUMN league_id UUID REFERENCES ${schemaPrefix}leagues(id)
    `);

    // Dedupe index - prevent duplicate leagues with same name/season in an org
    await queryRunner.query(`
      CREATE UNIQUE INDEX leagues_dedupe_hint
        ON ${schemaPrefix}leagues (organization_id, lower(name), season_start)
        WHERE season_start IS NOT NULL
    `);

    // Index for common queries (list leagues by org, sorted by season)
    await queryRunner.query(`
      CREATE INDEX idx_leagues_org_season
        ON ${schemaPrefix}leagues(organization_id, season_start DESC, season_end DESC)
    `);

    // Index for team lookups
    await queryRunner.query(`
      CREATE INDEX idx_teams_league ON ${schemaPrefix}teams(league_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get schema from connection configuration
    const schema = (queryRunner.connection.driver.options as { schema?: string })
      .schema;
    const schemaPrefix = schema ? `"${schema}".` : '';

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS ${schemaPrefix}idx_teams_league
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS ${schemaPrefix}idx_leagues_org_season
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS ${schemaPrefix}leagues_dedupe_hint
    `);

    // Drop league_id column from teams
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}teams DROP COLUMN IF EXISTS league_id
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE IF EXISTS ${schemaPrefix}leagues
    `);
  }
}
