import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ownerOverview, updateStatus } from "@/lib/owner.functions";
import { DashboardLayout, StatusBadge, StatusSelect } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/lib/cart-store";
import { toast } from "sonner";

const qo = queryOptions({ queryKey: ["owner", "overview"], queryFn: () => ownerOverview() });

export const Route = createFileRoute("/_authenticated/dashboard/rooms")({
  head: () => ({ meta: [{ title: "Room Bookings" }, { name: "robots", content: "noindex" }] }),
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(qo); },
  errorComponent: ({ error }) => <DashboardLayout title="Room Bookings"><div className="text-destructive">{error.message}</div></DashboardLayout>,
  notFoundComponent: () => <DashboardLayout title="Room Bookings">Not found</DashboardLayout>,
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const upd = useServerFn(updateStatus);
  const mut = useMutation({
    mutationFn: (v: { id: string; status: any }) => upd({ data: { table: "room_bookings", ...v } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["owner", "overview"] }); toast.success("Updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DashboardLayout title="Room Bookings">
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref</TableHead><TableHead>Guest</TableHead><TableHead>Room</TableHead>
              <TableHead>Dates</TableHead><TableHead>Guests</TableHead><TableHead>Total</TableHead>
              <TableHead>Contact</TableHead><TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.bookings.map((b: any) => (
              <TableRow key={b.id}>
                <TableCell className="font-mono text-xs">{b.reference}</TableCell>
                <TableCell>{b.guest_name}</TableCell>
                <TableCell>{b.rooms?.name}</TableCell>
                <TableCell className="text-xs">{b.check_in} → {b.check_out}</TableCell>
                <TableCell>{b.guests}</TableCell>
                <TableCell>{formatINR(Number(b.total))}</TableCell>
                <TableCell className="text-xs">{b.phone}<br />{b.email}</TableCell>
                <TableCell>
                  <div className="flex gap-2 items-center">
                    <StatusBadge status={b.status} />
                    <StatusSelect value={b.status} disabled={mut.isPending} onChange={(s) => mut.mutate({ id: b.id, status: s })} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data.bookings.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No bookings yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </DashboardLayout>
  );
}