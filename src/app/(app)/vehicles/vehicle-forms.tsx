"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Pencil, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { VEHICLE_TYPES, REGIONS } from "@/lib/constants";
import { useQuickCreate } from "@/components/use-quick-create";
import {
  createVehicleAction,
  updateVehicleAction,
  retireVehicleAction,
} from "@/server/actions/vehicles";

export type VehicleDto = {
  id: string;
  regNumber: string;
  name: string;
  type: string;
  maxLoadKg: number;
  odometerKm: number;
  acquisitionCost: number;
  region: string;
  status: string;
};

function VehicleFields({ vehicle }: { vehicle?: VehicleDto }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="regNumber">Registration No.</Label>
          <Input id="regNumber" name="regNumber" defaultValue={vehicle?.regNumber} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Name / Model</Label>
          <Input id="name" name="name" defaultValue={vehicle?.name} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select
            name="type"
            defaultValue={vehicle?.type ?? "VAN"}
            items={VEHICLE_TYPES.map((t) => ({ value: t, label: t.charAt(0) + t.slice(1).toLowerCase() }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VEHICLE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Region</Label>
          <Select
            name="region"
            defaultValue={vehicle?.region ?? "WEST"}
            items={REGIONS.map((r) => ({ value: r, label: r.charAt(0) + r.slice(1).toLowerCase() }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="maxLoadKg">Max Load (kg)</Label>
          <Input id="maxLoadKg" name="maxLoadKg" type="number" step="any" min="1" defaultValue={vehicle?.maxLoadKg} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="odometerKm">Odometer (km)</Label>
          <Input id="odometerKm" name="odometerKm" type="number" step="any" min="0" defaultValue={vehicle?.odometerKm ?? 0} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acquisitionCost">Acquisition Cost</Label>
          <Input id="acquisitionCost" name="acquisitionCost" type="number" step="any" min="0" defaultValue={vehicle?.acquisitionCost} required />
        </div>
      </div>
    </>
  );
}

export function AddVehicleDialog() {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  useQuickCreate(setOpen);

  const submit = (formData: FormData) => {
    startTransition(async () => {
      const res = await createVehicleAction(formData);
      if (res.ok) {
        toast.success("Vehicle registered.");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-1" /> Add Vehicle
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register Vehicle</DialogTitle>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          <VehicleFields />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Register"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function VehicleRowActions({ vehicle }: { vehicle: VehicleDto }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const submitEdit = (formData: FormData) => {
    startTransition(async () => {
      const res = await updateVehicleAction(vehicle.id, formData);
      if (res.ok) {
        toast.success("Vehicle updated.");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  const retire = () => {
    if (!confirm(`Retire ${vehicle.regNumber}? It will no longer be dispatchable.`)) return;
    startTransition(async () => {
      const res = await retireVehicleAction(vehicle.id);
      if (res.ok) toast.success("Vehicle retired.");
      else toast.error(res.error);
    });
  };

  return (
    <div className="flex justify-end gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="ghost" size="icon" aria-label="Edit" />}>
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
          </DialogHeader>
          <form action={submitEdit} className="space-y-4">
            <VehicleFields vehicle={vehicle} />
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      {vehicle.status !== "RETIRED" && (
        <Button variant="ghost" size="icon" aria-label="Retire" onClick={retire} disabled={pending}>
          <Archive className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
