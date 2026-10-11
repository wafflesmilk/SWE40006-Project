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
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Notes</h1>
          <p className="mt-1 text-sm text-gray-500">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </p>
        </div>
        <Link
          to="/notes/new"
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-blue-700"
        >
          New note
        </Link>
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
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {notes.map((note) => (
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