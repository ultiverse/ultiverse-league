import { AppDataSource } from './data-source';

interface TableNameRow {
  table_name: string;
}

interface MigrationRow {
  id: number;
  timestamp: string;
  name: string;
}

/** Small helper to strongly type query result rows */
async function queryRowsStrict<T>(
  sql: string,
  params: unknown[] = [],
  guard: (row: unknown) => row is T,
): Promise<T[]> {
  const raw: unknown = await AppDataSource.query(sql, params);
  if (!Array.isArray(raw)) {
    throw new Error('Expected query to return an array of rows');
  }
  // Validate each row before returning so it's no longer `any`
  const out: T[] = [];
  for (const r of raw) {
    if (!guard(r)) {
      throw new Error('Query row failed validation');
    }
    out.push(r);
  }
  return out;
}

/** Type guard for rows returned by information_schema.tables */
function isTableNameRow(row: unknown): row is TableNameRow {
  return (
    typeof row === 'object' &&
    row !== null &&
    'table_name' in row &&
    typeof (row as { table_name?: unknown }).table_name === 'string'
  );
}

/** Type guard for migration tracking rows */
function isMigrationRow(row: unknown): row is MigrationRow {
  return (
    typeof row === 'object' &&
    row !== null &&
    'id' in row &&
    'timestamp' in row &&
    'name' in row &&
    typeof (row as { id?: unknown }).id === 'number' &&
    typeof (row as { timestamp?: unknown }).timestamp === 'string' &&
    typeof (row as { name?: unknown }).name === 'string'
  );
}

async function runMigrations(): Promise<void> {
  try {
    console.log('🔄 Initializing database connection...');
    console.log(`Environment: ${process.env.NODE_ENV}`);
    const schema =
      (AppDataSource.options as { schema?: string }).schema ?? 'public';
    console.log(`Schema: ${schema}`);

    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Check if tables exist in the target schema
    const tables = await queryRowsStrict<TableNameRow>(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1
      AND table_name IN ('accounts', 'profiles', 'integration_connections', 'teams', 'players')
      ORDER BY table_name;
    `,
      [schema],
      isTableNameRow,
    );

    console.log(
      `\n📊 Found ${tables.length} application tables in ${schema} schema`,
    );
    if (tables.length > 0) {
      tables.forEach((t) => console.log(`  - ${t.table_name}`));
    }

    // Check migration tracking table
    let migrationRecords: MigrationRow[] = [];
    try {
      migrationRecords = await queryRowsStrict<MigrationRow>(
        `SELECT * FROM "${schema}".migrations ORDER BY timestamp`,
        [],
        isMigrationRow,
      );
      console.log(
        `\n📋 Migration tracking: ${migrationRecords.length} recorded migrations`,
      );
      if (migrationRecords.length > 0) {
        migrationRecords.forEach((m) => {
          console.log(`  ✓ ${m.name}`);
        });
      }
    } catch {
      // No migration table yet
      console.log('\n📋 No migration tracking table found yet');
    }

    // If migrations are recorded but tables don't exist, clear the migration table
    if (migrationRecords.length > 0 && tables.length === 0) {
      console.log('\n⚠️  WARNING: Migrations recorded but tables missing!');
      console.log(
        '🔄 Clearing migration tracking table to re-run migrations...',
      );
      await AppDataSource.query(`DELETE FROM "${schema}".migrations`);
      console.log('✅ Migration tracking cleared');
    }

    console.log('\n🔄 Running migrations...');
    // TypeORM returns an array of migration metadata with a `.name` we log.
    const migrations = (await AppDataSource.runMigrations({
      transaction: 'each',
    })) as ReadonlyArray<{ name: string }>;

    if (migrations.length === 0) {
      console.log('✅ No migrations to run - database is up to date');
    } else {
      console.log(`✅ Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach((migration) => {
        console.log(`  - ${migration.name}`);
      });
    }

    // Verify tables were created
    const finalTables = await queryRowsStrict<TableNameRow>(
      `
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = $1
  AND table_name IN ('accounts', 'profiles', 'integration_connections', 'teams', 'players')
  ORDER BY table_name;
`,
      [schema],
      isTableNameRow,
    );

    console.log(
      `\n✅ Final verification: ${finalTables.length} application tables exist`,
    );
    if (finalTables.length < 5) {
      throw new Error(`Expected 5 core tables but found ${finalTables.length}`);
    }

    await AppDataSource.destroy();
    console.log('✅ Migration process completed successfully\n');
    process.exit(0);
  } catch (error: unknown) {
    // ensure the caught value is safe to print
    if (error instanceof Error) {
      console.error('\n❌ Migration failed:', error);
    } else {
      console.error('\n❌ Migration failed:', String(error));
    }
    process.exit(1);
  }
}

void runMigrations();
