"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
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
import { DOCUMENT_KINDS } from "@/lib/constants";
import {
  uploadVehicleDocumentAction,
  deleteVehicleDocumentAction,
} from "@/server/actions/vehicleDocuments";

export function UploadDocumentDialog({ vehicleId }: { vehicleId: string }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const submit = (formData: FormData) => {
    startTransition(async () => {
      const res = await uploadVehicleDocumentAction(formData);
      if (res.ok) {
        toast.success("Document uploaded.");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="h-4 w-4 mr-1" /> Upload Document
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Vehicle Document</DialogTitle>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="e.g. Insurance policy 2026" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Kind</Label>
              <Select name="kind" defaultValue="RC">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiryDate">Expiry (optional)</Label>
              <Input id="expiryDate" name="expiryDate" type="date" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="file">File (PDF, JPG, PNG — max 5MB)</Label>
            <Input id="file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png" required />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Uploading…" : "Upload"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteDocumentButton({ id, vehicleId }: { id: string; vehicleId: string }) {
  const [pending, startTransition] = React.useTransition();

  const remove = () => {
    if (!confirm("Delete this document?")) return;
    startTransition(async () => {
      const res = await deleteVehicleDocumentAction(id, vehicleId);
      if (res.ok) toast.success("Document deleted.");
      else toast.error(res.error);
    });
  };

  return (
    <Button variant="ghost" size="icon" aria-label="Delete document" onClick={remove} disabled={pending}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
