import { AppDataSource } from './data-source';

async function runMigrations() {
  try {
    console.log('🔄 Initializing database connection...');
    console.log(`Environment: ${process.env.NODE_ENV}`);
    const schema = (AppDataSource.options as any).schema || 'public';
    console.log(`Schema: ${schema}`);

    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Check if tables exist in the target schema
    const tables = await AppDataSource.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1
      AND table_name IN ('accounts', 'profiles', 'integration_connections', 'teams', 'players')
      ORDER BY table_name;
    `, [schema]);

    console.log(`\n📊 Found ${tables.length} application tables in ${schema} schema`);
    if (tables.length > 0) {
      tables.forEach((t: any) => console.log(`  - ${t.table_name}`));
    }

    // Check migration tracking table
    let migrationRecords = [];
    try {
      migrationRecords = await AppDataSource.query(
        `SELECT * FROM "${schema}".migrations ORDER BY timestamp`,
      );
      console.log(`\n📋 Migration tracking: ${migrationRecords.length} recorded migrations`);
      if (migrationRecords.length > 0) {
        migrationRecords.forEach((m: any) => {
          console.log(`  ✓ ${m.name}`);
        });
      }
    } catch (error) {
      console.log('\n📋 No migration tracking table found yet');
    }

    // If migrations are recorded but tables don't exist, clear the migration table
    if (migrationRecords.length > 0 && tables.length === 0) {
      console.log('\n⚠️  WARNING: Migrations recorded but tables missing!');
      console.log('🔄 Clearing migration tracking table to re-run migrations...');
      await AppDataSource.query(`DELETE FROM "${schema}".migrations`);
      console.log('✅ Migration tracking cleared');
    }

    console.log('\n🔄 Running migrations...');
    const migrations = await AppDataSource.runMigrations({
      transaction: 'each',
    });

    if (migrations.length === 0) {
      console.log('✅ No migrations to run - database is up to date');
    } else {
      console.log(`✅ Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach((migration) => {
        console.log(`  - ${migration.name}`);
      });
    }

    // Verify tables were created
    const finalTables = await AppDataSource.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1
      AND table_name IN ('accounts', 'profiles', 'integration_connections', 'teams', 'players')
      ORDER BY table_name;
    `, [schema]);

    console.log(`\n✅ Final verification: ${finalTables.length} application tables exist`);
    if (finalTables.length < 5) {
      throw new Error(`Expected 5 core tables but found ${finalTables.length}`);
    }

    await AppDataSource.destroy();
    console.log('✅ Migration process completed successfully\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
