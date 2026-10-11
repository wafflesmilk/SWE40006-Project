import { Form, Link, data, redirect } from "react-router";
import type { Route } from "./+types/note";
import { deleteNote, getNote } from "~/db.server";

export async function loader({ params }: Route.LoaderArgs) {
  const note = await getNote(Number(params.id));
  if (!note) {
    throw data("Note not found", { status: 404 });
  }
  return { note };
}

export async function action({ params }: Route.ActionArgs) {
  await deleteNote(Number(params.id));
  return redirect("/");
}

export function meta() {
  return [{ title: "Note" }];
}

export default function Note({ loaderData }: Route.ComponentProps) {
  const { note } = loaderData;
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="text-sm text-blue-600 hover:underline">
        ← Back to notes
      </Link>

      <article className="mt-4 rounded-xl border border-gray-200 p-6 shadow-sm dark:border-gray-800">
        <h1 className="text-2xl font-bold">{note.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Created {new Date(note.created_at).toLocaleString()}
        </p>
        <hr className="my-5 border-gray-200 dark:border-gray-800" />
        <p className="whitespace-pre-wrap leading-relaxed">{note.content}</p>
      </article>

      <div className="mt-6 flex justify-end">
        <Form method="post">
          <button
            type="submit"
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-red-700"
          >
            Delete note
          </button>
        </Form>
      </div>
    </main>
  );
}