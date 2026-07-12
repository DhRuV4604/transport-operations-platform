"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Send, CheckCircle2, XCircle } from "lucide-react";
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
import {
  createTripAction,
  dispatchTripAction,
  completeTripAction,
  cancelTripAction,
} from "@/server/actions/trips";

export type VehicleOption = { id: string; regNumber: string; name: string; maxLoadKg: number };
export type DriverOption = { id: string; name: string; licenseCategory: string };

export function NewTripDialog({
  vehicles,
  drivers,
}: {
  vehicles: VehicleOption[];
  drivers: DriverOption[];
}) {
  const [open, setOpen] = React.useState(false);
  const [vehicleId, setVehicleId] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  const submit = (formData: FormData) => {
    startTransition(async () => {
      const res = await createTripAction(formData);
      if (res.ok) {
        toast.success("Trip created as draft.");
        setOpen(false);
        setVehicleId(null);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-1" /> New Trip
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Trip</DialogTitle>
          <DialogDescription>
            Only available vehicles and available drivers with valid licenses are listed.
          </DialogDescription>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="source">Source</Label>
              <Input id="source" name="source" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destination">Destination</Label>
              <Input id="destination" name="destination" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Vehicle</Label>
            <Select
              name="vehicleId"
              value={vehicleId}
              onValueChange={(v) => setVehicleId(v as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select available vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No available vehicles</div>
                )}
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.regNumber} · {v.name} (max {v.maxLoadKg} kg)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVehicle && (
              <p className="text-xs text-muted-foreground">
                Max load capacity: {selectedVehicle.maxLoadKg.toLocaleString()} kg
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Driver</Label>
            <Select name="driverId">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select available driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No eligible drivers</div>
                )}
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} ({d.licenseCategory})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cargoWeightKg">Cargo (kg)</Label>
              <Input id="cargoWeightKg" name="cargoWeightKg" type="number" step="any" min="1" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plannedDistanceKm">Distance (km)</Label>
              <Input id="plannedDistanceKm" name="plannedDistanceKm" type="number" step="any" min="1" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="revenue">Revenue</Label>
              <Input id="revenue" name="revenue" type="number" step="any" min="0" defaultValue={0} required />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating…" : "Create draft trip"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TripRowActions({ trip }: { trip: { id: string; status: string; startOdometerKm: number | null } }) {
  const [completeOpen, setCompleteOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const dispatch = () => {
    startTransition(async () => {
      const res = await dispatchTripAction(trip.id);
      if (res.ok) toast.success("Trip dispatched — vehicle and driver are now On Trip.");
      else toast.error(res.error);
    });
  };

  const cancel = () => {
    if (!confirm("Cancel this trip? A dispatched trip's vehicle and driver will be freed.")) return;
    startTransition(async () => {
      const res = await cancelTripAction(trip.id);
      if (res.ok) toast.success("Trip cancelled.");
      else toast.error(res.error);
    });
  };

  const complete = (formData: FormData) => {
    startTransition(async () => {
      const res = await completeTripAction(trip.id, formData);
      if (res.ok) {
        toast.success("Trip completed — vehicle and driver are Available again.");
        setCompleteOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="flex justify-end gap-1">
      {trip.status === "DRAFT" && (
        <Button size="sm" onClick={dispatch} disabled={pending}>
          <Send className="h-3.5 w-3.5 mr-1" /> Dispatch
        </Button>
      )}
      {trip.status === "DISPATCHED" && (
        <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
          <DialogTrigger render={<Button size="sm" variant="outline" />}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Complete
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Complete Trip</DialogTitle>
              <DialogDescription>
                Enter the final odometer reading and fuel consumed.
                {trip.startOdometerKm != null && ` Start odometer: ${trip.startOdometerKm.toLocaleString()} km.`}
              </DialogDescription>
            </DialogHeader>
            <form action={complete} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="endOdometerKm">Final odometer (km)</Label>
                <Input
                  id="endOdometerKm"
                  name="endOdometerKm"
                  type="number"
                  step="any"
                  min={trip.startOdometerKm ?? 0}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fuelLiters">Fuel consumed (L)</Label>
                  <Input id="fuelLiters" name="fuelLiters" type="number" step="any" min="0" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fuelCost">Fuel cost</Label>
                  <Input id="fuelCost" name="fuelCost" type="number" step="any" min="0" required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Completing…" : "Complete trip"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
      {(trip.status === "DRAFT" || trip.status === "DISPATCHED") && (
        <Button size="sm" variant="ghost" onClick={cancel} disabled={pending}>
          <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
        </Button>
      )}
    </div>
  );
}
