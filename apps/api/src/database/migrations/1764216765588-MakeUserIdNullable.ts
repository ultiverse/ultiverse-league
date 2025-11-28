import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeUserIdNullable1764216765588 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get schema from connection configuration
    const schema = (
      queryRunner.connection.driver.options as { schema?: string }
    ).schema;
    const schemaPrefix = schema ? `"${schema}".` : '';

    // Make userId nullable in memberships table
    // This allows player-based memberships (from roster imports) without requiring a userId
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}memberships
        ALTER COLUMN "userId" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get schema from connection configuration
    const schema = (
      queryRunner.connection.driver.options as { schema?: string }
    ).schema;
    const schemaPrefix = schema ? `"${schema}".` : '';

    // Note: This down migration might fail if there are player-only memberships
    // You may need to delete player-only memberships or assign them to users first
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}memberships
        ALTER COLUMN "userId" SET NOT NULL
    `);
  }
}
