/**
 * Model List Table Component
 * 
 * Displays models in a table format with selection, sorting, and actions.
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
import type { ModelWithDetails } from "~/server/types";

interface ModelListTableProps {
  models: ModelWithDetails[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (model: ModelWithDetails) => void;
  onDelete: (model: ModelWithDetails) => void;
}

export function ModelListTable({
  models,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
}: ModelListTableProps) {
  const allSelected = models.length > 0 && models.every((model) => selectedIds.has(model.id));
  const someSelected = models.some((model) => selectedIds.has(model.id)) && !allSelected;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleSelectAll}
                aria-label="Select all models"
                className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
                {...(someSelected && { "data-state": "indeterminate" })}
              />
            </TableHead>
            <TableHead>Make</TableHead>
            <TableHead>Model Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead className="text-right">Vehicles</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Published</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                No models found
              </TableCell>
            </TableRow>
          ) : (
            models.map((model) => (
              <TableRow
                key={model.id}
                className={selectedIds.has(model.id) ? "bg-muted/50" : ""}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(model.id)}
                    onCheckedChange={() => onToggleSelect(model.id)}
                    aria-label={`Select ${model.name}`}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/makes?search=${model.make.name}`}
                    className="font-medium hover:underline"
                  >
                    {model.make.name}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">{model.name}</TableCell>
                <TableCell className="text-muted-foreground">{model.slug}</TableCell>
                <TableCell className="text-right">{model._count.vehicles}</TableCell>
                <TableCell>
                  {model.isActive ? (
                    <Badge variant="default" className="bg-green-500">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {model.isPublished ? (
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
                      <DropdownMenuItem onClick={() => onEdit(model)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/vehicles?modelId=${model.id}`}>
                          <Car className="mr-2 h-4 w-4" />
                          View Vehicles
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(model)}
                        className="text-red-600 focus:text-red-600"
                        disabled={model._count.vehicles > 0}
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

