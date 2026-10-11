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

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data?.note.title ?? "Note" }];
}

export default function Note({ loaderData }: Route.ComponentProps) {
  const { note } = loaderData;
  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link to="/" className="text-blue-600">← Back to notes</Link>
      <h1 className="my-4 text-2xl font-bold">{note.title}</h1>
      <p className="mb-2 text-sm text-gray-500">
        {new Date(note.created_at).toLocaleString()}
      </p>
      <p className="mb-6 whitespace-pre-wrap">{note.content}</p>
      <Form method="post">
        <button type="submit" className="rounded bg-red-600 px-4 py-2 text-white">
          Delete note
        </button>
      </Form>
    </main>
  );
}