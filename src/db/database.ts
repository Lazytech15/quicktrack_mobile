import * as SQLite from 'expo-sqlite';

const DB_NAME = 'quicktrack.db';

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
  }
  return db;
};

export const initDatabase = async (): Promise<void> => {
  const database = getDatabase();

  database.execSync(`
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      serial_number TEXT,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      last_checked TEXT,
      next_check_due TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS equipment_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER NOT NULL,
      technician TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      photos TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      synced INTEGER NOT NULL DEFAULT 0,
      sync_attempts INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id)
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id INTEGER NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      attempts INTEGER NOT NULL DEFAULT 0,
      last_attempt TEXT,
      status TEXT NOT NULL DEFAULT 'pending'
    );
  `);

  await seedDemoData(database);
};

const seedDemoData = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  const existing = database.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM equipment'
  );
  if (existing && existing.count > 0) return;

  const equipment = [
    {
      name: 'Air Compressor Unit A1',
      location: 'Building 3 - Floor 2',
      serial_number: 'AC-2024-001',
      category: 'HVAC',
      status: 'active',
      last_checked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      next_check_due: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Monthly filter replacement required',
    },
    {
      name: 'Generator B2',
      location: 'Basement - Room 101',
      serial_number: 'GEN-2023-042',
      category: 'Electrical',
      status: 'active',
      last_checked: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      next_check_due: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Fuel level check required weekly',
    },
    {
      name: 'Water Pump WP-3',
      location: 'Utility Room C',
      serial_number: 'WP-2022-015',
      category: 'Plumbing',
      status: 'maintenance',
      last_checked: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      next_check_due: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Currently under scheduled maintenance',
    },
    {
      name: 'Fire Suppression Panel',
      location: 'Security Office',
      serial_number: 'FS-2021-003',
      category: 'Safety',
      status: 'active',
      last_checked: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      next_check_due: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Annual inspection compliant',
    },
    {
      name: 'Elevator Motor Unit',
      location: 'Roof Mechanical Room',
      serial_number: 'EL-2020-007',
      category: 'Mechanical',
      status: 'active',
      last_checked: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      next_check_due: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Lubrication done last visit',
    },
  ];

  for (const item of equipment) {
    database.runSync(
      `INSERT INTO equipment (name, location, serial_number, category, status, last_checked, next_check_due, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.name, item.location, item.serial_number ?? null,
        item.category, item.status, item.last_checked ?? null,
        item.next_check_due ?? null, item.notes ?? null,
      ]
    );
  }
};
