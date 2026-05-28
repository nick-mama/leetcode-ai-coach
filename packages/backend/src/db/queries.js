import db from "./database.js";

// Problems
export const problemQueries = {
  // Upsert = insert if not exists, return existing if it does
  // This is useful because the same problem can have multiple sessions
  upsert(problem) {
    const stmt = db.prepare(`
      INSERT INTO problems (title, slug, difficulty, topics, url)
      VALUES (@title, @slug, @difficulty, @topics, @url)
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        difficulty = excluded.difficulty,
        topics = excluded.topics
      RETURNING *
    `);
    return stmt.get({
      ...problem,
      topics: JSON.stringify(problem.topics ?? []),
    });
  },

  findBySlug(slug) {
    return db.prepare("SELECT * FROM problems WHERE slug = ?").get(slug);
  },

  getAll() {
    return db.prepare("SELECT * FROM problems ORDER BY created_at DESC").all();
  },
};

// Sessions
export const sessionQueries = {
  create(problemId) {
    const stmt = db.prepare(`
      INSERT INTO sessions (problem_id)
      VALUES (?)
      RETURNING *
    `);
    return stmt.get(problemId);
  },

  end(sessionId, solved = false) {
    const stmt = db.prepare(`
      UPDATE sessions
      SET 
        status = 'completed',
        ended_at = CURRENT_TIMESTAMP,
        duration_seconds = CAST((julianday(CURRENT_TIMESTAMP) - julianday(started_at)) * 86400 AS INTEGER),
        solved = ?
      WHERE id = ?
      RETURNING *
    `);
    return stmt.get(solved ? 1 : 0, sessionId);
  },

  findById(id) {
    return db.prepare("SELECT * FROM sessions WHERE id = ?").get(id);
  },

  // Get a session with its problem attached. Useful for the coaching context
  findWithProblem(id) {
    return db
      .prepare(
        `
      SELECT 
        s.*,
        p.title as problem_title,
        p.slug as problem_slug,
        p.difficulty as problem_difficulty,
        p.topics as problem_topics
      FROM sessions s
      JOIN problems p ON p.id = s.problem_id
      WHERE s.id = ?
    `,
      )
      .get(id);
  },

  getRecent(limit = 10) {
    return db
      .prepare(
        `
      SELECT 
        s.*,
        p.title as problem_title,
        p.difficulty as problem_difficulty
      FROM sessions s
      JOIN problems p ON p.id = s.problem_id
      ORDER BY s.started_at DESC
      LIMIT ?
    `,
      )
      .all(limit);
  },
};

// Turns

export const turnQueries = {
  add(sessionId, role, content) {
    const stmt = db.prepare(`
      INSERT INTO turns (session_id, role, content)
      VALUES (?, ?, ?)
      RETURNING *
    `);
    return stmt.get(sessionId, role, content);
  },

  // Get all turns for a session in chronological order
  // This is what we feed to the AI as conversation history
  getBySession(sessionId) {
    return db
      .prepare(
        `
      SELECT * FROM turns 
      WHERE session_id = ? 
      ORDER BY created_at ASC
    `,
      )
      .all(sessionId);
  },
};
