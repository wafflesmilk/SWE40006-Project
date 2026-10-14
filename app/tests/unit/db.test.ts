//----- Unit tests for the database functions ----//

import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  checkDatabase,
  createNote,
  deleteNote,
  getNote,
  getNotes,
} from "../../db.server";

// mock function
const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

// use mock version of the pg package
vi.mock("pg", () => ({
  default: {
    Pool: vi.fn(
      class MockPool {
        query = queryMock;
      },
    ),
  },
}));

// reset function before every test
beforeEach(() => {
  queryMock.mockReset();
});

// tests for notes retrieval functionality
describe("getNotes", () => {
  test("returns all notes from the database", async () => {
    const notes = [
      {
        id: 1,
        title: "first note",
        content: "test note 1",
        created_at: new Date("2026-10-10"),
      },
      {
        id: 2,
        title: "second note",
        content: "test note 2",
        created_at: new Date("2026-10-13"),
      },
    ];

    queryMock.mockResolvedValue({
      rows: notes,
    });

    const result = await getNotes();

    expect(queryMock).toHaveBeenCalledOnce();
    expect(queryMock).toHaveBeenCalledWith(
      "SELECT id, title, content, created_at FROM notes ORDER BY created_at DESC",
    );
    expect(result).toEqual(notes);
  });

  test("returns an empty array when there are no notes", async () => {
    queryMock.mockResolvedValue({
      rows: [],
    });

    const result = await getNotes();

    expect(result).toEqual([]);
  });
});

// tests for checkDatabase function
describe("checkDatabase", () => {
  test("check database connection", async () => {
    queryMock.mockResolvedValue({
      rows: [{ "?column?": 1 }],
    });

    await checkDatabase();

    expect(queryMock).toHaveBeenCalledOnce();
    expect(queryMock).toHaveBeenCalledWith("SELECT 1");
  });

  test("return an error when the database is unavailable", async () => {
    queryMock.mockRejectedValue(new Error("Database unavailable"));

    await expect(checkDatabase()).rejects.toThrow("Database unavailable");
  });
});

// tests for single note retrieval functionality
describe("getNote", () => {
  test("returns the requested note", async () => {
    const note = {
      id: 5,
      title: "Test note",
      content: "Test note 1",
      created_at: new Date("2026-10-13"),
    };

    queryMock.mockResolvedValue({
      rows: [note],
    });

    const result = await getNote(5);

    expect(queryMock).toHaveBeenCalledWith(
      "SELECT id, title, content, created_at FROM notes WHERE id = $1",
      [5],
    );

    expect(result).toEqual(note);
  });

  test("returns null when the note does not exist", async () => {
    queryMock.mockResolvedValue({
      rows: [],
    });

    const result = await getNote(999);

    expect(result).toBeNull();
  });

  test("uses a parameterised query for the note ID", async () => {
    queryMock.mockResolvedValue({
      rows: [],
    });

    await getNote(12);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("WHERE id = $1"),
      [12],
    );
  });
});

// tests for note creation functionality
describe("createNote", () => {
  test("creates a note and returns its ID", async () => {
    queryMock.mockResolvedValue({
      rows: [{ id: 7 }],
    });

    const result = await createNote("New note", "New note content");

    expect(queryMock).toHaveBeenCalledWith(
      "INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING id",
      ["New note", "New note content"],
    );

    expect(result).toBe(7);
  });

  test("propagates an error when note creation fails", async () => {
    queryMock.mockRejectedValue(new Error("Insert failed"));

    await expect(createNote("New note", "New content")).rejects.toThrow(
      "Insert failed",
    );
  });
});

// tests for note deletion functionality
describe("deleteNote", () => {
  test("deletes the selected note", async () => {
    queryMock.mockResolvedValue({
      rowCount: 1,
      rows: [],
    });

    await deleteNote(4);

    expect(queryMock).toHaveBeenCalledOnce();

    expect(queryMock).toHaveBeenCalledWith(
      "DELETE FROM notes WHERE id = $1",
      [4],
    );
  });

  test("propagates an error when deletion fails", async () => {
    queryMock.mockRejectedValue(new Error("Delete failed"));

    await expect(deleteNote(4)).rejects.toThrow("Delete failed");
  });
});
