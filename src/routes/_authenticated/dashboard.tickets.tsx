import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { listAllTickets, updateTicket } from "@/lib/support.functions";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/tickets")({
  head: () => ({ meta: [{ title: "Support Tickets — Owner" }, { name: "robots", content: "noindex" }] }),
  component: TicketsPage,
});

type TicketStatus = "open" | "in_progress" | "closed";

function TicketsPage() {
  const list = useServerFn(listAllTickets);
  const update = useServerFn(updateTicket);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["owner", "tickets"], queryFn: () => list() });
  const mut = useMutation({
    mutationFn: (vars: { id: string; status?: TicketStatus; reply?: string }) => update({ data: vars }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["owner", "tickets"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed"),
  });
  const [replies, setReplies] = useState<Record<string, string>>({});

  return (
    <DashboardLayout title="Support Tickets">
      {q.isLoading && <p>Loading…</p>}
      {q.data && q.data.length === 0 && <p className="text-muted-foreground">No tickets yet.</p>}
      <div className="space-y-3">
        {q.data?.map((t) => (
          <Card key={t.id} className="p-4 border-gold/20">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display text-lg">{t.subject}</div>
                <div className="text-xs text-muted-foreground">{t.name} · {t.email} · {new Date(t.created_at).toLocaleString()}</div>
                <p className="mt-2 text-sm whitespace-pre-wrap">{t.message}</p>
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold",
                t.status === "open" ? "bg-gold/20 text-gold" : t.status === "in_progress" ? "bg-maroon/20 text-maroon" : "bg-secondary text-muted-foreground",
              )}>{t.status.replace("_", " ")}</span>
            </div>
            <div className="mt-3 space-y-2">
              <Textarea
                rows={2}
                placeholder="Write a reply to the customer…"
                defaultValue={t.reply ?? ""}
                onChange={(e) => setReplies((r) => ({ ...r, [t.id]: e.target.value }))}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={mut.isPending} onClick={() => mut.mutate({ id: t.id, reply: replies[t.id] ?? t.reply ?? "" })} className="bg-gold text-ink hover:bg-gold/90">Save Reply</Button>
                <Button size="sm" variant="outline" disabled={mut.isPending} onClick={() => mut.mutate({ id: t.id, status: "in_progress" })}>Mark in progress</Button>
                <Button size="sm" variant="outline" disabled={mut.isPending} onClick={() => mut.mutate({ id: t.id, status: "closed" })}>Close</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}