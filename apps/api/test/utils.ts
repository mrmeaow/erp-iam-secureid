import { DataSource } from 'typeorm';

export async function truncateTables(dataSource: DataSource) {
  const entities = dataSource.entityMetadatas;
  const tableNames = entities
    .map((entity) => `"${entity.tableName}"`)
    .join(', ');

  await dataSource.query(`TRUNCATE TABLE ${tableNames} CASCADE;`);
}
