"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { addFuelLogAction, addExpenseAction } from "@/server/actions/expenses";
import { useQuickCreate } from "@/components/use-quick-create";

type VehicleOpt = { id: string; regNumber: string };

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function AddFuelLogDialog({ vehicles }: { vehicles: VehicleOpt[] }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  useQuickCreate(setOpen);

  const submit = (formData: FormData) => {
    startTransition(async () => {
      const res = await addFuelLogAction(formData);
      if (res.ok) {
        toast.success("Fuel log recorded.");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-1" /> Add Fuel Log
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record Fuel</DialogTitle>
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
                    {v.regNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="liters">Liters</Label>
              <Input id="liters" name="liters" type="number" step="any" min="0.1" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cost">Cost</Label>
              <Input id="cost" name="cost" type="number" step="any" min="0" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" defaultValue={today()} required />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Record fuel"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddExpenseDialog({ vehicles }: { vehicles: VehicleOpt[] }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const submit = (formData: FormData) => {
    startTransition(async () => {
      const res = await addExpenseAction(formData);
      if (res.ok) {
        toast.success("Expense recorded.");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus className="h-4 w-4 mr-1" /> Add Expense
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record Expense</DialogTitle>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select name="category" defaultValue="TOLL">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0) + c.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle (optional)</Label>
              <Select name="vehicleId" defaultValue="none">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.regNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" step="any" min="0.01" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={today()} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="e.g. Expressway toll" required />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Record expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
