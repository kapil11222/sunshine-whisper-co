import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Annapurna Palace" }, { name: "robots", content: "noindex" }] }),
  component: () => <Outlet />,
});