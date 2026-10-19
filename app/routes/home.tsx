import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/home";
import { getNotes } from "~/db.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Notes" }];
}

export async function loader() {
  return { notes: await getNotes() };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { notes } = loaderData;
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query),
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Notes</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}
          </p>
        </div>
        <Link
          to="/notes/new"
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-blue-700"
        >
          New note
        </Link>
      </div>

      <div className="mb-6">
        <label htmlFor="search-notes" className="mb-2 block text-sm font-medium">
          Search notes
        </label>
        <input
          id="search-notes"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title or content"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700"
        />
      </div>

      {notes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <p className="text-lg font-medium">No notes yet.</p>
          <p className="mt-1 text-gray-500">Your notes will appear here.</p>
          <Link
            to="/notes/new"
            className="mt-4 inline-block font-medium text-blue-600 hover:underline"
          >
            Create your first note →
          </Link>
        </div>
      ) : filteredNotes.length === 0 ? (
        <p className="py-8 text-center text-gray-500" role="status">
          No notes match your search.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {filteredNotes.map((note) => (
            <li key={note.id}>
              <Link
                to={`/notes/${note.id}`}
                className="block h-full rounded-xl border border-gray-200 p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md dark:border-gray-800"
              >
                <h2 className="truncate text-lg font-semibold">{note.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">
                  {note.content}
                </p>
                <p className="mt-4 text-xs text-gray-500">
                  {new Date(note.created_at).toLocaleString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
