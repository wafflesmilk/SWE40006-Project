import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("notes/new", "routes/new-note.tsx"),
  route("notes/:id", "routes/note.tsx"),
  route("health", "routes/health.ts"),
] satisfies RouteConfig;