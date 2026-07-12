"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVICE_TYPES } from "@/lib/constants";
import { openMaintenanceAction, closeMaintenanceAction } from "@/server/actions/maintenance";

export function NewMaintenanceDialog({
  vehicles,
}: {
  vehicles: { id: string; regNumber: string; name: string; status: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const submit = (formData: FormData) => {
    startTransition(async () => {
      const res = await openMaintenanceAction(formData);
      if (res.ok) {
        toast.success("Maintenance opened — vehicle moved to In Shop.");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-1" /> New Record
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Open Maintenance Record</DialogTitle>
          <DialogDescription>
            The vehicle is automatically switched to “In Shop” and removed from the dispatch pool.
          </DialogDescription>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Vehicle</Label>
            <Select name="vehicleId">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.regNumber} · {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Service Type</Label>
              <Select name="serviceType" defaultValue="ROUTINE">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cost">Estimated Cost</Label>
              <Input id="cost" name="cost" type="number" step="any" min="0" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="e.g. Oil change" required />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Opening…" : "Open record"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CloseMaintenanceButton({ logId }: { logId: string }) {
  const [pending, startTransition] = React.useTransition();
  const close = () => {
    startTransition(async () => {
      const res = await closeMaintenanceAction(logId);
      if (res.ok) toast.success("Maintenance closed — vehicle restored to Available.");
      else toast.error(res.error);
    });
  };
  return (
    <Button size="sm" variant="outline" onClick={close} disabled={pending}>
      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {pending ? "Closing…" : "Close"}
    </Button>
  );
}
