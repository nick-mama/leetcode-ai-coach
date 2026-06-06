const Database = require("better-sqlite3");
const db = new Database("packages/backend/data/coach.db");

const fixes = [
  {
    slug: "top-k-elements-in-list",
    topics: ["Array", "Hash Table", "Sorting", "Heap (Priority Queue)"],
  },
  {
    slug: "top-k-frequent-elements",
    topics: ["Array", "Hash Table", "Sorting", "Heap (Priority Queue)"],
  },
];

const stmt = db.prepare("UPDATE problems SET topics = ? WHERE slug = ?");
fixes.forEach(({ slug, topics }) => {
  const result = stmt.run(JSON.stringify(topics), slug);
  console.log(`${slug} → rows updated: ${result.changes}`);
});
