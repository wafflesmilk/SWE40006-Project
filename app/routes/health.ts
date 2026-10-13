import { checkDatabase } from "~/db.server";

export async function loader() {
  try {
    await checkDatabase();
    return Response.json({ status: "ok", database: "connected" });
  } catch {
    return Response.json(
      { status: "error", database: "unreachable" },
      { status: 503 }
    );
  }
}