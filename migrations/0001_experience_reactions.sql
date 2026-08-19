CREATE TABLE experience_reactions (
  experience_slug TEXT NOT NULL,
  voter_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (experience_slug, voter_id)
) WITHOUT ROWID;
