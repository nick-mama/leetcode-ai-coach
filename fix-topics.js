const Database = require("better-sqlite3");
const db = new Database("packages/backend/data/coach.db");

const rows = db
  .prepare(
    `
  SELECT p.title, p.difficulty, p.topics, s.solved, si.comm_score 
  FROM sessions s 
  JOIN problems p ON p.id = s.problem_id 
  LEFT JOIN session_insights si ON si.session_id = s.id
  WHERE s.status = 'completed'
`,
  )
  .all();

console.log(JSON.stringify(rows, null, 2));
