"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Pencil, Ban, RotateCcw, Mail } from "lucide-react";
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
import { LICENSE_CATEGORIES } from "@/lib/constants";
import {
  createDriverAction,
  updateDriverAction,
  setDriverStatusAction,
  sendLicenseRemindersAction,
} from "@/server/actions/drivers";

export type DriverDto = {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string; // yyyy-MM-dd
  phone: string;
  safetyScore: number;
  status: string;
};

function DriverFields({ driver }: { driver?: DriverDto }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={driver?.name} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Contact Number</Label>
          <Input id="phone" name="phone" defaultValue={driver?.phone} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="licenseNumber">License Number</Label>
          <Input id="licenseNumber" name="licenseNumber" defaultValue={driver?.licenseNumber} required />
        </div>
        <div className="space-y-1.5">
          <Label>License Category</Label>
          <Select name="licenseCategory" defaultValue={driver?.licenseCategory ?? "LMV"}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LICENSE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="licenseExpiry">License Expiry</Label>
          <Input id="licenseExpiry" name="licenseExpiry" type="date" defaultValue={driver?.licenseExpiry} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="safetyScore">Safety Score (0–100)</Label>
          <Input id="safetyScore" name="safetyScore" type="number" min="0" max="100" defaultValue={driver?.safetyScore ?? 80} required />
        </div>
      </div>
    </>
  );
}

export function AddDriverDialog() {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const submit = (formData: FormData) => {
    startTransition(async () => {
      const res = await createDriverAction(formData);
      if (res.ok) {
        toast.success("Driver added.");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-1" /> Add Driver
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Driver</DialogTitle>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          <DriverFields />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Add driver"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DriverRowActions({ driver }: { driver: DriverDto }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const submitEdit = (formData: FormData) => {
    startTransition(async () => {
      const res = await updateDriverAction(driver.id, formData);
      if (res.ok) {
        toast.success("Driver updated.");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  const setStatus = (status: "AVAILABLE" | "SUSPENDED") => {
    if (status === "SUSPENDED" && !confirm(`Suspend ${driver.name}?`)) return;
    startTransition(async () => {
      const res = await setDriverStatusAction(driver.id, status);
      if (res.ok) toast.success(status === "SUSPENDED" ? "Driver suspended." : "Driver reinstated.");
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
            <DialogTitle>Edit Driver</DialogTitle>
          </DialogHeader>
          <form action={submitEdit} className="space-y-4">
            <DriverFields driver={driver} />
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      {driver.status === "SUSPENDED" ? (
        <Button variant="ghost" size="icon" aria-label="Reinstate" onClick={() => setStatus("AVAILABLE")} disabled={pending}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      ) : (
        <Button variant="ghost" size="icon" aria-label="Suspend" onClick={() => setStatus("SUSPENDED")} disabled={pending || driver.status === "ON_TRIP"}>
          <Ban className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function SendRemindersButton() {
  const [pending, startTransition] = React.useTransition();

  const send = () => {
    startTransition(async () => {
      const res = await sendLicenseRemindersAction();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (res.sent === 0) {
        toast.info("No reminders due — everything expiring was already reminded in the last 24h.");
        return;
      }
      toast.success(
        `Reminded ${res.recipients} safety officer(s) about ${res.sent} driver(s).`,
        res.previewUrls.length
          ? { description: `Preview: ${res.previewUrls[0]}` }
          : undefined
      );
    });
  };

  return (
    <Button variant="outline" onClick={send} disabled={pending}>
      <Mail className="h-4 w-4 mr-1" /> {pending ? "Sending…" : "Send reminders now"}
    </Button>
  );
}
