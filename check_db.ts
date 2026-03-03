import Database from "better-sqlite3";
const db = new Database("fuel_management.db");
const movements = db.prepare("SELECT count(*) as count FROM movements").get() as { count: number };
const users = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
const fuelTypes = db.prepare("SELECT count(*) as count FROM fuel_types").get() as { count: number };
console.log({ movements, users, fuelTypes });
