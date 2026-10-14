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
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="text-sm text-blue-600 hover:underline">
        ← Back to notes
      </Link>

      <div className="mt-4 rounded-xl border border-gray-200 p-6 shadow-sm dark:border-gray-800">
        <h1 className="mb-6 text-2xl font-bold">New note</h1>
        <Form method="post" className="space-y-5">
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              name="title"
              placeholder="Title"
              className="w-full rounded-lg border border-gray-300 bg-transparent p-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700"
            />
          </div>
          <div>
            <label htmlFor="content" className="mb-1 block text-sm font-medium">
              Content
            </label>
            <textarea
              id="content"
              name="content"
              placeholder="Write your note..."
              rows={8}
              className="w-full rounded-lg border border-gray-300 bg-transparent p-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700"
            />
          </div>

          {actionData?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {actionData.error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Save note
            </button>
            <Link
              to="/"
              className="rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-900"
            >
              Cancel
            </Link>
          </div>
        </Form>
      </div>
    </main>
  );
}
