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
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Notes</h1>
        <Link to="/notes/new" className="rounded bg-blue-600 px-4 py-2 text-white">
          New note
        </Link>
      </div>
      {notes.length === 0 ? (
        <p>No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                to={`/notes/${note.id}`}
                className="block rounded border p-4 hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                <h2 className="font-semibold">{note.title}</h2>
                <p className="text-sm text-gray-500">
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