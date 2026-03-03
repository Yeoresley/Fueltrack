import Database from "better-sqlite3";
const db = new Database("fuel_management.db");
db.prepare("INSERT INTO movements (type, date, quantity, price) VALUES (?, ?, ?, ?)").run('entry', '2026-03-02', 100, 10);
const movements = db.prepare("SELECT count(*) as count FROM movements").get() as { count: number };
console.log({ movements });
