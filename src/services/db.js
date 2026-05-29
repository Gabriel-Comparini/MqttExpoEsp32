import { openDatabaseAsync } from "expo-sqlite";

let db;

export async function initDatabase() {
    db = await openDatabaseAsync("./hist.db");

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS history(
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            modified_date DATETIME DEFAULT CURRENT_TIMESTAMP, 
            hum INTEGER NOT NULL,
            temp INTEGER NOT NULL, 
            light INTEGER NOT NULL
        );
    `);
}

export async function insertNewData(hum, temp, light) {
    await db.runAsync('INSERT INTO history(hum, temp, light) VALUES (?, ?, ?)', [hum, temp, light]);
}

export async function selectData() {
    return await db.getAllAsync('SELECT * FROM history ORDER BY id DESC');
}

export async function deleteData() {
    await db.runAsync('DELETE FROM history');
    await db.runAsync('DELETE FROM sqlite_sequence WHERE name="history"');
}