import db from "./database.js";

// All table creation in one place for easy management and future migrations

export function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS problems (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      slug        TEXT UNIQUE NOT NULL,  -- e.g. "two-sum", used as identifier
      difficulty  TEXT,                  -- Easy / Medium / Hard
      topics      TEXT,                  -- JSON array: ["array", "hashmap"]
      url         TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_id  INTEGER NOT NULL REFERENCES problems(id),
      status      TEXT DEFAULT 'active', -- active | completed | abandoned
      started_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at    DATETIME,
      duration_seconds INTEGER,          -- filled in when session ends
      solved      INTEGER DEFAULT 0      -- 0 = false, 1 = true (SQLite has no bool)
    );

    CREATE TABLE IF NOT EXISTS turns (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id  INTEGER NOT NULL REFERENCES sessions(id),
      role        TEXT NOT NULL,         -- "user" or "assistant"
      content     TEXT NOT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("✅ Database schema initialized");
}
