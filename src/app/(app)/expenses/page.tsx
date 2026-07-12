import { format } from "date-fns";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { hasPermission, EXPENSE_CATEGORIES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataRow } from "@/components/data-table";
import { AddFuelLogDialog, AddExpenseDialog } from "./expense-forms";

export default async function ExpensesPage() {
  const session = await requireSession();
  const canWrite = hasPermission(session.role, "expenses.write");

  const [fuelLogs, expenses, vehicles] = await Promise.all([
    db.fuelLog.findMany({ include: { vehicle: true, trip: true }, orderBy: { date: "desc" } }),
    db.expense.findMany({ include: { vehicle: true }, orderBy: { date: "desc" } }),
    db.vehicle.findMany({ where: { status: { not: "RETIRED" } }, orderBy: { regNumber: "asc" } }),
  ]);

  const totalFuelCost = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalFuelLiters = fuelLogs.reduce((s, f) => s + f.liters, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const fuelRows: DataRow[] = fuelLogs.map((f) => ({
    id: f.id,
    cells: {
      vehicle: { value: f.vehicle.regNumber, node: <span className="font-medium">{f.vehicle.regNumber}</span> },
      liters: { value: f.liters, node: `${f.liters.toLocaleString()} L` },
      cost: { value: f.cost, node: `₹${f.cost.toLocaleString()}` },
      trip: {
        value: f.trip ? `${f.trip.source} → ${f.trip.destination}` : "",
        node: f.trip ? `${f.trip.source} → ${f.trip.destination}` : "—",
      },
      date: { value: f.date.toISOString(), node: format(f.date, "dd MMM yyyy") },
    },
  }));

  const expenseRows: DataRow[] = expenses.map((e) => ({
    id: e.id,
    cells: {
      category: { value: e.category },
      description: { value: e.description },
      vehicle: { value: e.vehicle?.regNumber ?? "", node: e.vehicle?.regNumber ?? "—" },
      amount: { value: e.amount, node: `₹${e.amount.toLocaleString()}` },
      date: { value: e.date.toISOString(), node: format(e.date, "dd MMM yyyy") },
    },
  }));

  const vehicleOpts = vehicles.map((v) => ({ id: v.id, regNumber: v.regNumber }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fuel & Expenses</h1>
          <p className="text-sm text-muted-foreground">Operational spend across the fleet</p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <AddFuelLogDialog vehicles={vehicleOpts} />
            <AddExpenseDialog vehicles={vehicleOpts} />
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Fuel Cost</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">₹{totalFuelCost.toLocaleString()}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Fuel Volume</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totalFuelLiters.toLocaleString()} L</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Other Expenses</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">₹{totalExpenses.toLocaleString()}</CardContent>
        </Card>
      </div>

      <Tabs defaultValue="fuel">
        <TabsList>
          <TabsTrigger value="fuel">Fuel Logs</TabsTrigger>
          <TabsTrigger value="expenses">Other Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value="fuel" className="mt-3">
          <DataTable
            columns={[
              { key: "vehicle", label: "Vehicle" },
              { key: "liters", label: "Liters" },
              { key: "cost", label: "Cost" },
              { key: "trip", label: "Trip" },
              { key: "date", label: "Date" },
            ]}
            rows={fuelRows}
            searchPlaceholder="Search fuel logs…"
            exportHref="/api/export/fuel"
            emptyMessage="No fuel logs."
          />
        </TabsContent>
        <TabsContent value="expenses" className="mt-3">
          <DataTable
            columns={[
              { key: "category", label: "Category" },
              { key: "description", label: "Description" },
              { key: "vehicle", label: "Vehicle" },
              { key: "amount", label: "Amount" },
              { key: "date", label: "Date" },
            ]}
            rows={expenseRows}
            filters={[
              { key: "category", label: "Categories", options: EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })) },
            ]}
            searchPlaceholder="Search expenses…"
            exportHref="/api/export/expenses"
            emptyMessage="No expenses."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
