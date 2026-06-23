import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ownerOverview, updateStatus } from "@/lib/owner.functions";
import { DashboardLayout, StatusBadge, StatusSelect } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const qo = queryOptions({ queryKey: ["owner", "overview"], queryFn: () => ownerOverview() });

export const Route = createFileRoute("/_authenticated/dashboard/tables")({
  head: () => ({ meta: [{ title: "Table Reservations" }, { name: "robots", content: "noindex" }] }),
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(qo); },
  errorComponent: ({ error }) => <DashboardLayout title="Table Reservations"><div className="text-destructive">{error.message}</div></DashboardLayout>,
  notFoundComponent: () => <DashboardLayout title="Table Reservations">Not found</DashboardLayout>,
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const upd = useServerFn(updateStatus);
  const mut = useMutation({
    mutationFn: (v: { id: string; status: any }) => upd({ data: { table: "table_reservations", ...v } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["owner", "overview"] }); toast.success("Updated"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <DashboardLayout title="Table Reservations">
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref</TableHead><TableHead>Guest</TableHead><TableHead>When</TableHead>
              <TableHead>Party</TableHead><TableHead>Contact</TableHead><TableHead>Notes</TableHead><TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.reservations.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.reference}</TableCell>
                <TableCell>{r.guest_name}</TableCell>
                <TableCell className="text-xs">{new Date(r.reserved_at).toLocaleString()}</TableCell>
                <TableCell>{r.party_size}</TableCell>
                <TableCell className="text-xs">{r.phone}<br />{r.email}</TableCell>
                <TableCell className="text-xs max-w-[200px] truncate">{r.notes}</TableCell>
                <TableCell>
                  <div className="flex gap-2 items-center">
                    <StatusBadge status={r.status} />
                    <StatusSelect value={r.status} disabled={mut.isPending} onChange={(s) => mut.mutate({ id: r.id, status: s })} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data.reservations.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No reservations yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </DashboardLayout>
  );
}