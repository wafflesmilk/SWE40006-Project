import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/new-note";
import { createNote } from "~/db.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: "New note" }];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!title || !content) {
    return { error: "Title and content are required." };
  }

  const id = await createNote(title, content);
  return redirect(`/notes/${id}`);
}

export default function NewNote({ actionData }: Route.ComponentProps) {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link to="/" className="text-blue-600">← Back to notes</Link>
      <h1 className="my-4 text-2xl font-bold">New note</h1>
      <Form method="post" className="space-y-4">
        <input
          name="title"
          placeholder="Title"
          className="w-full rounded border p-2"
        />
        <textarea
          name="content"
          placeholder="Write your note..."
          rows={6}
          className="w-full rounded border p-2"
        />
        {actionData?.error && <p className="text-red-600">{actionData.error}</p>}
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
          Save note
        </button>
      </Form>
    </main>
  );
}