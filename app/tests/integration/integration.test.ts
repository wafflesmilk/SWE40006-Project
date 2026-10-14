import {
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
} from "vitest";
import pg from "pg";
import {
  checkDatabase,
  createNote,
  deleteNote,
  getNote,
  getNotes,
} from "../../db.server";
import { action as newNoteAction } from "../../routes/new-note";
import { loader as homeLoader } from "../../routes/home";
import { loader as noteLoader, action as noteAction } from "../../routes/note";

// connect to db in Docker container
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// create fake input object
const args = (init: { request?: Request; params?: Record<string, string> }) =>
  ({
    request: init.request ?? new Request("http://localhost/"),
    params: init.params ?? {},
    context: {},
  }) as any;

// create request
const submitForm = (fields: Record<string, string>) =>
  new Request("http://localhost/notes/new", {
    method: "POST",
    body: new URLSearchParams(fields),
  });

beforeAll(async () => {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.toLowerCase().includes("test")) {
    throw new Error("DATABASE_URL cannot be empty.");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
});

// clear db data before each test run
beforeEach(async () => {
  await pool.query("TRUNCATE notes RESTART IDENTITY");
});

afterAll(async () => {
  await pool.end();
});

describe("checkDatabase", () => {
  test("checkDatabase resolves when the database is reachable", async () => {
    await expect(checkDatabase()).resolves.toBeUndefined();
  });
});

describe("createNote", () => {
  test("creates a note and returns its id", async () => {
    const id = await createNote("SWE40006", "integration testing");

    expect(id).toBeTypeOf("number");

    const { rows } = await pool.query("SELECT * FROM notes WHERE id = $1", [
      id,
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("SWE40006");
    expect(rows[0].content).toBe("integration testing");
    expect(rows[0].created_at).toBeInstanceOf(Date);
  });

  test("assigns a different id to each note", async () => {
    const a = await createNote("1", "a");
    const b = await createNote("2", "b");
    expect(a).not.toBe(b);
  });

  test("rejects a note with an empty title", async () => {
    await expect(createNote("", "content")).rejects.toThrow();

    const { rows } = await pool.query("SELECT * FROM notes");
    expect(rows).toHaveLength(0);
  });

  test("rejects a note with empty content", async () => {
    await expect(createNote("title", "")).rejects.toThrow();
  });

  test("rejects a title longer than 200 characters", async () => {
    await expect(createNote("x".repeat(201), "content")).rejects.toThrow();
  });

  test("accepts a title of exactly 200 characters", async () => {
    const id = await createNote("x".repeat(200), "content");
    expect((await getNote(id))?.title).toHaveLength(200);
  });
});

describe("getNotes", () => {
  test("returns an empty list when there are no notes", async () => {
    expect(await getNotes()).toEqual([]);
  });

  test("returns all notes", async () => {
    await createNote("note 1", "hello");
    await createNote("note 2", "bye");
    await createNote("note 3", "hi");

    const notes = await getNotes();
    expect(notes).toHaveLength(3);
    expect(notes.map((n) => n.title)).toEqual(
      expect.arrayContaining(["note 1", "note 2", "note 3"]),
    );
  });

  test("returns only the expected fields", async () => {
    await createNote("Shape", "check");
    const [note] = await getNotes();
    expect(Object.keys(note).sort()).toEqual(
      ["content", "created_at", "id", "title"].sort(),
    );
  });
});

describe("getNote", () => {
  test("returns the note with the given id", async () => {
    const id = await createNote("note 1", "hello");

    const note = await getNote(id);
    expect(note).toMatchObject({ id, title: "note 1", content: "hello" });
  });

  test("returns null when the note does not exist", async () => {
    expect(await getNote(40006)).toBeNull();
  });
});

describe("deleteNote", () => {
  test("removes the note from the database", async () => {
    const id = await createNote("note 1", "bye");

    await deleteNote(id);

    const { rows } = await pool.query("SELECT * FROM notes WHERE id = $1", [
      id,
    ]);
    expect(rows).toHaveLength(0);
    expect(await getNote(id)).toBeNull();
  });

  test("only one note is deleted at a time, all other notes are retained", async () => {
    const keep = await createNote("note to keep", "a");
    const remove = await createNote("note to delete", "d");

    await deleteNote(remove);

    const notes = await getNotes();
    expect(notes).toHaveLength(1);
    expect(notes[0].id).toBe(keep);
  });

  test("does not throw when the note does not exist", async () => {
    await expect(deleteNote(100)).resolves.toBeUndefined();
  });
});

describe("entire note lifecycle", () => {
  test("create, list, view, delete, list again", async () => {
    const id = await createNote("note", "hello");

    expect(await getNotes()).toHaveLength(1);
    expect((await getNote(id))?.title).toBe("note");

    await deleteNote(id);

    expect(await getNotes()).toHaveLength(0);
    expect(await getNote(id)).toBeNull();
  });
});

describe("new note action", () => {
  test("creates the note and redirects to it", async () => {
    const res = (await newNoteAction(
      args({ request: submitForm({ title: "note", content: "hello" }) }),
    )) as Response;

    expect(res).toBeInstanceOf(Response);
    expect(res.status).toBe(302); // React returns 302 by default

    const { rows } = await pool.query("SELECT * FROM notes");
    expect(rows).toHaveLength(1);
    expect(res.headers.get("Location")).toBe(`/notes/${rows[0].id}`);
    expect(rows[0].title).toBe("note");
    expect(rows[0].content).toBe("hello");
  });

  test("strip title and content before saving", async () => {
    await newNoteAction(
      args({ request: submitForm({ title: "  note  ", content: "hi  " }) }),
    );

    const { rows } = await pool.query("SELECT * FROM notes");
    expect(rows[0].title).toBe("note");
    expect(rows[0].content).toBe("hi");
  });

  test("returns an error and saves nothing when the title is empty", async () => {
    const result = await newNoteAction(
      args({ request: submitForm({ title: "", content: "body" }) }),
    );

    expect(result).toEqual({ error: "Title and content are required." });
    const { rows } = await pool.query("SELECT * FROM notes");
    expect(rows).toHaveLength(0);
  });

  test("returns an error and saves nothing when the content is empty", async () => {
    const result = await newNoteAction(
      args({ request: submitForm({ title: "Title", content: "" }) }),
    );

    expect(result).toEqual({ error: "Title and content are required." });
    const { rows } = await pool.query("SELECT * FROM notes");
    expect(rows).toHaveLength(0);
  });

  test("rejects whitespace fields", async () => {
    const result = await newNoteAction(
      args({ request: submitForm({ title: "   ", content: "   " }) }),
    );

    expect(result).toEqual({ error: "Title and content are required." });
  });
});

describe("home loader", () => {
  test("returns an empty notes array when there are no notes", async () => {
    expect(await homeLoader()).toEqual({ notes: [] });
  });

  test("returns existing notes from newest to oldest (descending order)", async () => {
    await pool.query(
      `INSERT INTO notes (title, content, created_at) VALUES
       ('old', 'a', '2026-10-10'),
       ('new', 'b', '2026-10-13')`,
    );

    const { notes } = await homeLoader();
    expect(notes.map((n) => n.title)).toEqual(["new", "old"]);
  });
});

describe("note loader and delete action", () => {
  test("loader returns the requested note", async () => {
    const id = await createNote("note", "content");

    const result = await noteLoader(args({ params: { id: String(id) } }));

    expect(result.note).toMatchObject({ id, title: "note" });
  });

  test("loader throws a 404 for a note that does not exist", async () => {
    await expect(
      noteLoader(args({ params: { id: "40006" } })),
    ).rejects.toMatchObject({ data: "Note not found", init: { status: 404 } });
  });

  test("redirects to home page after a note is deleted", async () => {
    const id = await createNote("note", "bye");

    const res = (await noteAction(
      args({ params: { id: String(id) } }),
    )) as Response;

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/");
    expect(await getNote(id)).toBeNull();
  });
});

describe("full flow through routes", () => {
  test("create note, see it in the list, view it, delete it", async () => {
    // create
    const created = (await newNoteAction(
      args({ request: submitForm({ title: "My Note", content: "full flow" }) }),
    )) as Response;
    const id = Number(created.headers.get("Location")!.split("/").pop());

    // list
    const { notes } = await homeLoader();
    expect(notes.map((n) => n.id)).toContain(id);

    // view
    const { note } = await noteLoader(args({ params: { id: String(id) } }));
    expect(note.content).toBe("full flow");

    // delete
    await noteAction(args({ params: { id: String(id) } }));
    expect((await homeLoader()).notes).toHaveLength(0);
  });
});
