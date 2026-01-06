"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type DataTableColumn<T> = {
  key: string;
  header: React.ReactNode;
  className?: string;
  headerClassName?: string;
  cell: (row: T, index: number) => React.ReactNode;
};

export type DataTableProps<T> = {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  getRowKey?: (row: T, index: number) => React.Key;
  loading?: boolean;
  emptyText?: string;
  stickyHeader?: boolean;
  className?: string;
  bodyClassName?: string;
  onRowClick?: (row: T, index: number) => void;
  getRowClassName?: (row: T, index: number) => string | undefined;
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  loading,
  emptyText = "Data tidak ditemukan",
  stickyHeader = true,
  className,
  bodyClassName,
  onRowClick,
  getRowClassName,
}: DataTableProps<T>) {
  return (
    <div className="w-full">
      <Table className={`${className} w-full`}>
        <TableHeader className={stickyHeader ? "sticky top-0 z-10 bg-background" : undefined}>
          <TableRow>
            {columns.map((c) => (
              <TableHead 
                key={c.key} 
                className={`${c.headerClassName}`}
              >
                <div className="truncate">
                  {c.header}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody className={bodyClassName}>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-16 text-center text-sm text-muted-foreground"
              >
                {loading ? "Memuat..." : emptyText}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => (
              <TableRow
                key={getRowKey ? getRowKey(row, idx) : idx}
                className={`align-top ${getRowClassName ? getRowClassName(row, idx) ?? "" : ""}`}
                onClick={() => onRowClick?.(row, idx)}
                role={onRowClick ? "button" : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (!onRowClick) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onRowClick(row, idx);
                  }
                }}
              >
                {columns.map((c) => (
                  <TableCell 
                    key={c.key} 
                    className={`${c.className}`}
                  >
                    <div className="truncate">
                      {c.cell(row, idx)}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}