-- 010-storyline_nodes.sql
-- Storyline Nodes
CREATE TABLE IF NOT EXISTS storyline_nodes (
  id TEXT PRIMARY KEY,
  storyline_id TEXT NOT NULL REFERENCES storylines(id),
  text TEXT NOT NULL,
  detail TEXT,
  tag_color TEXT,
  tag_label TEXT
);
