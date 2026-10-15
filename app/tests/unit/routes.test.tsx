//----- Unit tests for the different page routes ----//

import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { cleanup, render, screen } from "@testing-library/react";
import Home from "../../routes/home";

// create mock versions of the database functions
const {
  checkDatabaseMock,
  getNotesMock,
  getNoteMock,
  createNoteMock,
  deleteNoteMock,
} = vi.hoisted(() => ({
  checkDatabaseMock: vi.fn(),
  getNotesMock: vi.fn(),
  getNoteMock: vi.fn(),
  createNoteMock: vi.fn(),
  deleteNoteMock: vi.fn(),
}));

// replace the functions from db.server.ts with mocks
vi.mock("~/db.server", () => ({
  checkDatabase: checkDatabaseMock,
  getNotes: getNotesMock,
  getNote: getNoteMock,
  createNote: createNoteMock,
  deleteNote: deleteNoteMock,
}));

import { loader as healthLoader } from "../../routes/health";
import { loader as homeLoader, meta as homeMeta } from "../../routes/home";
import {
  action as newNoteAction,
  meta as newNoteMeta,
} from "../../routes/new-note";

import {
  action as noteAction,
  loader as noteLoader,
  meta as noteMeta,
} from "../../routes/note";

const sampleNotes = [
  {
    id: 2,
    title: "Second note",
    content: "Test note 2",
    created_at: new Date("2026-10-13"),
  },
  {
    id: 1,
    title: "First note",
    content: "Test note 1",
    created_at: new Date("2026-10-10"),
  },
];

// reset mocks before each test
beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  cleanup();
});

// tests for health route
describe("health", () => {
  test("returns a successful response when the database is reachable", async () => {
    checkDatabaseMock.mockResolvedValue(undefined);

    const response = await healthLoader();
    const body = await response.json();

    expect(checkDatabaseMock).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);

    expect(body).toEqual({
      status: "ok",
      database: "connected",
    });
  });

  test("returns a 503 response when the database is unreachable", async () => {
    checkDatabaseMock.mockRejectedValue(new Error("Database unreachable"));

    const response = await healthLoader();
    const body = await response.json();

    expect(checkDatabaseMock).toHaveBeenCalledOnce();
    expect(response.status).toBe(503);

    expect(body).toEqual({
      status: "error",
      database: "unreachable",
    });
  });
});

// tests for home route
describe("home route", () => {
  test("returns the page title", () => {
    const result = homeMeta({} as never);

    expect(result).toEqual([
      {
        title: "Notes",
      },
    ]);
  });

  test("loads notes from the database", async () => {
    getNotesMock.mockResolvedValue(sampleNotes);

    const result = await homeLoader();

    expect(getNotesMock).toHaveBeenCalledOnce();

    expect(result).toEqual({
      notes: sampleNotes,
    });
  });

  test("returns an empty array when there are no notes", async () => {
    getNotesMock.mockResolvedValue([]);

    const result = await homeLoader();

    expect(getNotesMock).toHaveBeenCalledOnce();

    expect(result).toEqual({
      notes: [],
    });
  });
});

// tests for new note route
describe("new note", () => {
  function createRequest(title: string, content: string): Request {
    const formData = new FormData();

    formData.set("title", title);
    formData.set("content", content);

    return new Request("http://localhost/notes/new", {
      method: "POST",
      body: formData,
    });
  }

  test("returns the page title", () => {
    const result = newNoteMeta({} as never);

    expect(result).toEqual([
      {
        title: "New note",
      },
    ]);
  });

  test("creates a note and redirects to the note page", async () => {
    createNoteMock.mockResolvedValue(7);

    const request = createRequest("New note", "New note content");

    const response = await newNoteAction({
      request,
    } as never);

    expect(createNoteMock).toHaveBeenCalledOnce();

    expect(createNoteMock).toHaveBeenCalledWith("New note", "New note content");

    expect(response).toBeInstanceOf(Response);

    if (!(response instanceof Response)) {
      throw new Error("Expected the action to return a Response");
    }

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/notes/7");
  });

  test("trims the title and content before creating the note", async () => {
    createNoteMock.mockResolvedValue(8);

    const request = createRequest("  Trimmed title  ", "  Trimmed content  ");

    await newNoteAction({
      request,
    } as never);

    expect(createNoteMock).toHaveBeenCalledWith(
      "Trimmed title",
      "Trimmed content",
    );
  });

  test("returns an error when the title is empty", async () => {
    const request = createRequest("", "Test content");

    const result = await newNoteAction({
      request,
    } as never);

    expect(result).toEqual({
      error: "Title and content are required.",
    });

    expect(createNoteMock).not.toHaveBeenCalled();
  });

  test("returns an error when the content is empty", async () => {
    const request = createRequest("Test title", "");

    const result = await newNoteAction({
      request,
    } as never);

    expect(result).toEqual({
      error: "Title and content are required.",
    });

    expect(createNoteMock).not.toHaveBeenCalled();
  });

  test("returns an error when the inputs contain only whitespace", async () => {
    const request = createRequest("   ", "   ");

    const result = await newNoteAction({
      request,
    } as never);

    expect(result).toEqual({
      error: "Title and content are required.",
    });

    expect(createNoteMock).not.toHaveBeenCalled();
  });
});

// tests for individual note route
describe("note", () => {
  test("returns the page title", () => {
    const result = noteMeta();

    expect(result).toEqual([
      {
        title: "Note",
      },
    ]);
  });

  test("loads the requested note", async () => {
    const note = {
      id: 4,
      title: "Selected note",
      content: "Selected note content",
      created_at: new Date("2026-10-13"),
    };

    getNoteMock.mockResolvedValue(note);

    const result = await noteLoader({
      params: {
        id: "4",
      },
    } as never);

    expect(getNoteMock).toHaveBeenCalledOnce();
    expect(getNoteMock).toHaveBeenCalledWith(4);

    expect(result).toEqual({
      note,
    });
  });

  test("throws a 404 response when the note does not exist", async () => {
    getNoteMock.mockResolvedValue(null);

    await expect(
      noteLoader({
        params: {
          id: "999",
        },
      } as never),
    ).rejects.toMatchObject({
      data: "Note not found",
      init: {
        status: 404,
      },
    });

    expect(getNoteMock).toHaveBeenCalledWith(999);
  });

  test("deletes the requested note and redirects home", async () => {
    deleteNoteMock.mockResolvedValue(undefined);

    const response = await noteAction({
      params: {
        id: "4",
      },
    } as never);

    expect(deleteNoteMock).toHaveBeenCalledOnce();
    expect(deleteNoteMock).toHaveBeenCalledWith(4);

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
  });

  test("converts the ID to a number before deleting it", async () => {
    deleteNoteMock.mockResolvedValue(undefined);

    await noteAction({
      params: {
        id: "15",
      },
    } as never);

    expect(deleteNoteMock).toHaveBeenCalledWith(15);
  });
});

// tests for the home component to improve branch coverage
describe("home component", () => {
  test("shows the empty state when there are no notes", () => {
    render(
      <MemoryRouter>
        <Home
          loaderData={{ notes: [] } as never}
          params={{}}
          matches={[] as never}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("0 notes")).toBeTruthy();
    expect(screen.getByText("No notes yet.")).toBeTruthy();
    expect(screen.getByText("Your notes will appear here.")).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
  });

  test("does not show an empty state when notes exist", () => {
    render(
      <MemoryRouter>
        <Home
          loaderData={{ notes: sampleNotes }}
          params={{}}
          matches={[] as never}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByText("No notes yet.")).toBeNull();
    expect(screen.getByText("2 notes")).toBeTruthy();
  });

  test("caption says note instead of notes when there is a single note", () => {
    render(
      <MemoryRouter>
        <Home
          loaderData={{ notes: [sampleNotes[0]] }}
          params={{}}
          matches={[] as never}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByText("1 notes")).toBeNull();
    expect(screen.getByText("1 note")).toBeTruthy();
  });

  test("renders every note with its own link", () => {
    render(
      <MemoryRouter>
        <Home
          loaderData={{ notes: sampleNotes }}
          params={{}}
          matches={[] as never}
        />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("link", { name: /Second note/ }).getAttribute("href"),
    ).toBe("/notes/2");
    expect(
      screen.getByRole("link", { name: /First note/ }).getAttribute("href"),
    ).toBe("/notes/1");
  });
});
