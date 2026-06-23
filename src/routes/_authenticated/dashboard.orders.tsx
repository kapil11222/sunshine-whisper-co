import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ownerOverview, updateStatus } from "@/lib/owner.functions";
import { DashboardLayout, StatusBadge, StatusSelect } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatINR } from "@/lib/cart-store";
import { toast } from "sonner";

const qo = queryOptions({ queryKey: ["owner", "overview"], queryFn: () => ownerOverview() });

export const Route = createFileRoute("/_authenticated/dashboard/orders")({
  head: () => ({ meta: [{ title: "Pre-Orders" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(qo); },
  errorComponent: ({ error }) => <DashboardLayout title="Pre-Orders"><div className="text-destructive">{error.message}</div></DashboardLayout>,
  notFoundComponent: () => <DashboardLayout title="Pre-Orders">Not found</DashboardLayout>,
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const upd = useServerFn(updateStatus);
  const mut = useMutation({
    mutationFn: (v: { id: string; status: any }) => upd({ data: { table: "pre_orders", ...v } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["owner", "overview"] }); toast.success("Updated"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <DashboardLayout title="Pre-Orders">
      {data.orders.length === 0 && <Card className="p-8 text-center text-muted-foreground">No pre-orders yet</Card>}
      <Accordion type="multiple" className="space-y-3">
        {data.orders.map((o: any) => (
          <AccordionItem key={o.id} value={o.id} className="border rounded-lg bg-card">
            <AccordionTrigger className="px-4">
              <div className="flex-1 flex items-center gap-4 text-left">
                <span className="font-mono text-xs">{o.reference}</span>
                <span className="font-medium">{o.guest_name}</span>
                <span className="text-xs text-muted-foreground">{o.mode} · {new Date(o.scheduled_for).toLocaleString()}</span>
                <span className="text-gold ml-auto mr-3 font-semibold">{formatINR(Number(o.total))}</span>
                <StatusBadge status={o.status} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase text-muted-foreground mb-2">Items</div>
                  <ul className="text-sm space-y-1">
                    {(o.pre_order_items ?? []).map((it: any) => (
                      <li key={it.id} className="flex justify-between border-b py-1">
                        <span>{it.qty}× {it.dish_name}</span>
                        <span>{formatINR(Number(it.price) * it.qty)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="text-muted-foreground">Phone:</span> {o.phone}</div>
                  <div><span className="text-muted-foreground">Email:</span> {o.email}</div>
                  {o.notes && <div><span className="text-muted-foreground">Notes:</span> {o.notes}</div>}
                  <div className="pt-3">
                    <StatusSelect value={o.status} disabled={mut.isPending} onChange={(s) => mut.mutate({ id: o.id, status: s })} />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </DashboardLayout>
  );
}