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
        "organizationId" UUID NOT NULL REFERENCES ${schemaPrefix}organizations(id),
        name TEXT NOT NULL,
        "seasonStart" DATE,
        "seasonEnd" DATE,
        "sourceType" TEXT NOT NULL DEFAULT 'ultiverse',
        "isEditable" BOOLEAN NOT NULL DEFAULT true,
        visibility TEXT DEFAULT 'public',
        "createdAt" TIMESTAMPTZ DEFAULT now(),
        "updatedAt" TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Add leagueId to teams (nullable - teams can exist without leagues)
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}teams
        ADD COLUMN "leagueId" UUID REFERENCES ${schemaPrefix}leagues(id)
    `);

    // Dedupe index - prevent duplicate leagues with same name/season in an org
    await queryRunner.query(`
      CREATE UNIQUE INDEX leagues_dedupe_hint
        ON ${schemaPrefix}leagues ("organizationId", lower(name), "seasonStart")
        WHERE "seasonStart" IS NOT NULL
    `);

    // Index for common queries (list leagues by org, sorted by season)
    await queryRunner.query(`
      CREATE INDEX idx_leagues_org_season
        ON ${schemaPrefix}leagues("organizationId", "seasonStart" DESC, "seasonEnd" DESC)
    `);

    // Index for team lookups
    await queryRunner.query(`
      CREATE INDEX idx_teams_league ON ${schemaPrefix}teams("leagueId")
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
