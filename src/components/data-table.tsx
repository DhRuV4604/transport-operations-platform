"use client";

import * as React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type Cell = { value: string | number; node?: React.ReactNode };
export type DataRow = { id: string; cells: Record<string, Cell>; actions?: React.ReactNode };
export type Column = { key: string; label: string; sortable?: boolean; className?: string };
export type Filter = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

const ALL = "__all__";

export function DataTable({
  columns,
  rows,
  filters = [],
  searchPlaceholder = "Search…",
  exportHref,
  emptyMessage = "No records found.",
}: {
  columns: Column[];
  rows: DataRow[];
  filters?: Filter[];
  searchPlaceholder?: string;
  exportHref?: string;
  emptyMessage?: string;
}) {
  const [search, setSearch] = React.useState("");
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [filterValues, setFilterValues] = React.useState<Record<string, string>>({});

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const visible = React.useMemo(() => {
    let out = rows;
    const q = search.trim().toLowerCase();
    if (q) {
      out = out.filter((r) =>
        Object.values(r.cells).some((c) => String(c.value).toLowerCase().includes(q))
      );
    }
    for (const [key, val] of Object.entries(filterValues)) {
      if (val && val !== ALL) out = out.filter((r) => String(r.cells[key]?.value) === val);
    }
    if (sortKey) {
      out = [...out].sort((a, b) => {
        const av = a.cells[sortKey]?.value ?? "";
        const bv = b.cells[sortKey]?.value ?? "";
        const cmp =
          typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return out;
  }, [rows, search, filterValues, sortKey, sortDir]);

  const hasActions = rows.some((r) => r.actions);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8 w-56"
          />
        </div>
        {filters.map((f) => (
          <Select
            key={f.key}
            value={filterValues[f.key] ?? ALL}
            onValueChange={(v) => setFilterValues((s) => ({ ...s, [f.key]: (v as string) ?? ALL }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All {f.label}</SelectItem>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {visible.length} of {rows.length}
          </span>
          {exportHref && (
            <Button variant="outline" size="sm" render={<a href={exportHref} />}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          )}
        </div>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.sortable === false ? (
                    col.label
                  ) : (
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => toggleSort(col.key)}
                    >
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  )}
                </TableHead>
              ))}
              {hasActions && <TableHead className="w-0" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((col) => {
                    const cell = row.cells[col.key];
                    return (
                      <TableCell key={col.key} className={cn(col.className)}>
                        {cell?.node ?? cell?.value}
                      </TableCell>
                    );
                  })}
                  {hasActions && (
                    <TableCell className="text-right whitespace-nowrap">{row.actions}</TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
