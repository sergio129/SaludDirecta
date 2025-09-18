import migrateProducts from '../src/lib/migrate-products.mjs';

async function runMigration() {
  console.log('Iniciando migración de productos...');
  await migrateProducts();
  console.log('Migración finalizada.');
  process.exit(0);
}

runMigration().catch((error) => {
  console.error('Error ejecutando migración:', error);
  process.exit(1);
});