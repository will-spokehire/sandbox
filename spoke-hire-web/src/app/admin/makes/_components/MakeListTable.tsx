/**
 * Make List Table Component
 * 
 * Displays makes in a table format with selection, sorting, and actions.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Car, Check, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { MakeWithCount } from "~/server/types";

interface MakeListTableProps {
  makes: MakeWithCount[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (make: MakeWithCount) => void;
  onDelete: (make: MakeWithCount) => void;
}

export function MakeListTable({
  makes,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
}: MakeListTableProps) {
  const allSelected = makes.length > 0 && makes.every((make) => selectedIds.has(make.id));
  const someSelected = makes.some((make) => selectedIds.has(make.id)) && !allSelected;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleSelectAll}
                aria-label="Select all makes"
                className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
                {...(someSelected && { "data-state": "indeterminate" })}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead className="text-right">Models</TableHead>
            <TableHead className="text-right">Vehicles</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Published</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {makes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                No makes found
              </TableCell>
            </TableRow>
          ) : (
            makes.map((make) => (
              <TableRow
                key={make.id}
                className={selectedIds.has(make.id) ? "bg-muted/50" : ""}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(make.id)}
                    onCheckedChange={() => onToggleSelect(make.id)}
                    aria-label={`Select ${make.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{make.name}</TableCell>
                <TableCell className="text-muted-foreground">{make.slug}</TableCell>
                <TableCell className="text-right">{make._count.models}</TableCell>
                <TableCell className="text-right">{make._count.vehicles}</TableCell>
                <TableCell>
                  {make.isActive ? (
                    <Badge variant="default" className="bg-green-500">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {make.isPublished ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(make)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/vehicles?makeIds=${make.id}`}>
                          <Car className="mr-2 h-4 w-4" />
                          View Vehicles
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(make)}
                        className="text-red-600 focus:text-red-600"
                        disabled={make._count.vehicles > 0}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

