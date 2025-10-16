import { AppDataSource } from './data-source';

async function runMigrations() {
  try {
    console.log('🔄 Initializing database connection...');
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Schema: ${(AppDataSource.options as any).schema || 'default'}`);

    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    console.log('🔄 Running migrations...');
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

    await AppDataSource.destroy();
    console.log('✅ Migration process completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
