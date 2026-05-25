import { getDatabase } from './database';

export interface Equipment {
  id: number;
  name: string;
  location: string;
  serial_number?: string;
  category: string;
  status: 'active' | 'maintenance' | 'offline' | 'decommissioned';
  last_checked?: string;
  next_check_due?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentLog {
  id: number;
  equipment_id: number;
  technician: string;
  status: string;
  notes?: string;
  photos?: string;
  created_at: string;
  synced: number;
  sync_attempts: number;
}

export const getAllEquipment = (): Equipment[] => {
  const db = getDatabase();
  return db.getAllSync<Equipment>('SELECT * FROM equipment ORDER BY name ASC');
};

export const getEquipmentById = (id: number): Equipment | null => {
  const db = getDatabase();
  return db.getFirstSync<Equipment>('SELECT * FROM equipment WHERE id = ?', [id]);
};

export const getOverdueEquipment = (): Equipment[] => {
  const db = getDatabase();
  return db.getAllSync<Equipment>(
    `SELECT * FROM equipment
     WHERE next_check_due < datetime('now')
     AND status != 'decommissioned'
     ORDER BY next_check_due ASC`
  );
};

export const createEquipment = (data: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>): number => {
  const db = getDatabase();
  const result = db.runSync(
    `INSERT INTO equipment (name, location, serial_number, category, status, last_checked, next_check_due, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.name, data.location, data.serial_number ?? null, data.category,
     data.status, data.last_checked ?? null, data.next_check_due ?? null, data.notes ?? null]
  );
  addToSyncQueue('equipment', result.lastInsertRowId, 'INSERT', data);
  return result.lastInsertRowId;
};

export const updateEquipment = (id: number, data: Partial<Equipment>): void => {
  const db = getDatabase();
  const fields = Object.keys(data).filter(k => !['id','created_at','updated_at'].includes(k));
  const values = fields.map(f => (data as Record<string, unknown>)[f]);
  const sql = `UPDATE equipment SET ${fields.map(f => `${f} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`;
  db.runSync(sql, [...values, id]);
  addToSyncQueue('equipment', id, 'UPDATE', data);
};

export const getLogsForEquipment = (equipmentId: number): EquipmentLog[] => {
  const db = getDatabase();
  return db.getAllSync<EquipmentLog>(
    'SELECT * FROM equipment_logs WHERE equipment_id = ? ORDER BY created_at DESC',
    [equipmentId]
  );
};

export const createLog = (data: Omit<EquipmentLog, 'id' | 'created_at' | 'synced' | 'sync_attempts'>): number => {
  const db = getDatabase();
  const result = db.runSync(
    `INSERT INTO equipment_logs (equipment_id, technician, status, notes, photos)
     VALUES (?, ?, ?, ?, ?)`,
    [data.equipment_id, data.technician, data.status,
     data.notes ?? null, data.photos ?? null]
  );
  db.runSync(
    `UPDATE equipment SET last_checked = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
    [data.equipment_id]
  );
  addToSyncQueue('equipment_logs', result.lastInsertRowId, 'INSERT', data);
  return result.lastInsertRowId;
};

export const getUnsyncedLogs = (): EquipmentLog[] => {
  const db = getDatabase();
  return db.getAllSync<EquipmentLog>(
    'SELECT * FROM equipment_logs WHERE synced = 0 ORDER BY created_at ASC'
  );
};

export const markLogSynced = (id: number): void => {
  const db = getDatabase();
  db.runSync('UPDATE equipment_logs SET synced = 1 WHERE id = ?', [id]);
};

export const getSyncQueue = () => {
  const db = getDatabase();
  return db.getAllSync(
    "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC"
  );
};

const addToSyncQueue = (tableName: string, recordId: number, operation: string, payload: unknown): void => {
  const db = getDatabase();
  db.runSync(
    `INSERT INTO sync_queue (table_name, record_id, operation, payload) VALUES (?, ?, ?, ?)`,
    [tableName, recordId, operation, JSON.stringify(payload)]
  );
};

export const updateSyncQueueItem = (id: number, status: string): void => {
  const db = getDatabase();
  db.runSync(
    `UPDATE sync_queue SET status = ?, last_attempt = datetime('now'), attempts = attempts + 1 WHERE id = ?`,
    [status, id]
  );
};

export const getPendingSyncCount = (): number => {
  const db = getDatabase();
  const result = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'"
  );
  return result?.count ?? 0;
};
