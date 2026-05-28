import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// In ES modules, __dirname doesn't exist. This recreates it
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Store the database file in packages/backend/data/
// This keeps it out of src/ and easy to find
const DATA_DIR = path.join(__dirname, "../../data");
const DB_PATH = path.join(DATA_DIR, "coach.db");

// Make sure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Create (or open) the database
// better-sqlite3 is synchronous. No async/await needed
// This is intentional: SQLite is fast enough locally that async adds no value
const db = Database(DB_PATH);

// WAL mode = better performance for reads while writing
// This is a one-time pragma you always want for SQLite apps
db.pragma("journal_mode = WAL");

export default db;
