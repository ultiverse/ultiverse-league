import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExternalPlayerSources1760483000000
  implements MigrationInterface
{
  name = 'CreateExternalPlayerSources1760483000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get schema from connection configuration
    const schema = (queryRunner.connection.driver.options as { schema?: string })
      .schema;
    const schemaPrefix = schema ? `"${schema}".` : '';

    // Create external_player_sources table
    await queryRunner.query(`
      CREATE TABLE ${schemaPrefix}external_player_sources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        player_id UUID NOT NULL REFERENCES ${schemaPrefix}players(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        external_id TEXT NOT NULL,
        raw_data JSONB NOT NULL,
        etag TEXT,
        last_synced_at TIMESTAMPTZ DEFAULT now(),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (provider, external_id)
      )
    `);

    // Index for player lookups
    await queryRunner.query(`
      CREATE INDEX idx_external_player_sources_player
        ON ${schemaPrefix}external_player_sources(player_id)
    `);

    // Index for provider lookups (find by external ID)
    await queryRunner.query(`
      CREATE INDEX idx_external_player_sources_provider
        ON ${schemaPrefix}external_player_sources(provider, external_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get schema from connection configuration
    const schema = (queryRunner.connection.driver.options as { schema?: string })
      .schema;
    const schemaPrefix = schema ? `"${schema}".` : '';

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS ${schemaPrefix}idx_external_player_sources_provider
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS ${schemaPrefix}idx_external_player_sources_player
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE IF EXISTS ${schemaPrefix}external_player_sources
    `);
  }
}
