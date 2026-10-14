import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});

export type Note = {
  id: number;
  title: string;
  content: string;
  created_at: Date;
};

export async function getNotes() {
  const { rows } = await pool.query<Note>(
    "SELECT id, title, content, created_at FROM notes ORDER BY created_at DESC",
  );
  return rows;
}

export async function checkDatabase() {
  await pool.query("SELECT 1");
}

export async function getNote(id: number) {
  const { rows } = await pool.query<Note>(
    "SELECT id, title, content, created_at FROM notes WHERE id = $1",
    [id],
  );
  return rows[0] ?? null;
}

export async function createNote(title: string, content: string) {
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  if (!trimmedTitle || !trimmedContent) {
    throw new Error("Title and content are required.");
  }

  if (trimmedTitle.length > 200) {
    throw new Error("Title must not exceed 200 characters.");
  }
  const { rows } = await pool.query<{ id: number }>(
    "INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING id",
    [trimmedTitle, trimmedContent],
  );
  return rows[0].id;
}

export async function deleteNote(id: number) {
  await pool.query("DELETE FROM notes WHERE id = $1", [id]);
}
