import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export type Note = {
  id: number;
  title: string;
  content: string;
  created_at: Date;
};

export async function getNotes() {
  const { rows } = await pool.query<Note>(
    "SELECT id, title, content, created_at FROM notes ORDER BY created_at DESC"
  );
  return rows;
}

export async function getNote(id: number) {
  const { rows } = await pool.query<Note>(
    "SELECT id, title, content, created_at FROM notes WHERE id = $1",
    [id]
  );
  return rows[0] ?? null;
}

export async function createNote(title: string, content: string) {
  const { rows } = await pool.query<{ id: number }>(
    "INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING id",
    [title, content]
  );
  return rows[0].id;
}

export async function deleteNote(id: number) {
  await pool.query("DELETE FROM notes WHERE id = $1", [id]);
}