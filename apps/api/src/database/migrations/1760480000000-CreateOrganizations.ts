import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizations1760480000000 implements MigrationInterface {
  name = 'CreateOrganizations1760480000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get schema from connection configuration
    const schema = (queryRunner.connection.driver.options as { schema?: string })
      .schema;
    const schemaPrefix = schema ? `"${schema}".` : '';

    // Create organizations table
    await queryRunner.query(`
      CREATE TABLE ${schemaPrefix}organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Seed default organization
    await queryRunner.query(`
      INSERT INTO ${schemaPrefix}organizations (id, name, slug)
      VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default')
      ON CONFLICT (id) DO NOTHING
    `);

    // Add FK constraint to teams
    // Note: This assumes teams table already exists (from CreateTeamsAndMemberships migration)
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}teams
        ADD CONSTRAINT fk_teams_organization
        FOREIGN KEY (organization_id) REFERENCES ${schemaPrefix}organizations(id)
    `);

    // Create index for organization lookups
    await queryRunner.query(`
      CREATE INDEX idx_organizations_slug ON ${schemaPrefix}organizations(slug)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get schema from connection configuration
    const schema = (queryRunner.connection.driver.options as { schema?: string })
      .schema;
    const schemaPrefix = schema ? `"${schema}".` : '';

    // Drop FK constraint from teams
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}teams DROP CONSTRAINT IF EXISTS fk_teams_organization
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS ${schemaPrefix}idx_organizations_slug
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE IF EXISTS ${schemaPrefix}organizations
    `);
  }
}
