
"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useSearchParams } from 'next/navigation';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { TransactionFilters } from "./TransactionFilters"
import type { Transaction } from "@/lib/types"
import { TransactionForm } from "./TransactionForm"
import { getColumns } from "./columns"
import { useAppContext } from "@/context/AppContext"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslation } from "@/hooks/use-translation"

interface DataTableProps {
  data: Transaction[]
}

export function TransactionDataTable({
  data,
}: DataTableProps) {
  const { state: { categories } } = useAppContext();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'date', desc: true }])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | undefined>(undefined);

  const columns = React.useMemo(() => getColumns(categories), [categories]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    meta: {
      openEditForm: (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsFormOpen(true);
      }
    }
  })

  React.useEffect(() => {
    const type = searchParams.get('type');
    const categoryId = searchParams.get('categoryId');
    const walletId = searchParams.get('walletId');
    const tags = searchParams.get('tags');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const newFilters: ColumnFiltersState = [];
    if(type) newFilters.push({ id: 'type', value: type });
    if(categoryId) newFilters.push({ id: 'category', value: categoryId });
    if(walletId) newFilters.push({ id: 'wallet', value: walletId });
    if(tags) newFilters.push({ id: 'tags', value: tags });
    if(startDate && endDate) newFilters.push({ id: 'date', value: { from: new Date(startDate), to: new Date(endDate) } });
    
    setColumnFilters(newFilters);
  }, [searchParams]);

  return (
    <div className="space-y-4">
      <TransactionFilters table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => table.options.meta?.openEditForm(row.original)}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} onClick={(e) => {
                      if (cell.column.id === 'actions') {
                        e.stopPropagation();
                      }
                    }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t('noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">{t('rowsPerPage')}</p>
            <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
                table.setPageSize(Number(value))
            }}
            >
            <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
                {[10, 25, 50, 100, data.length].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize === data.length ? t('all') : pageSize}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>

        <div className="flex items-center justify-end space-x-2">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                {t('pageIndicator', { page: table.getState().pagination.pageIndex + 1, totalPages: table.getPageCount() })}
            </div>
            <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            >
            {t('previous')}
            </Button>
            <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            >
            {t('next')}
            </Button>
        </div>
      </div>
       <TransactionForm isOpen={isFormOpen} setIsOpen={setIsFormOpen} transaction={selectedTransaction} />
    </div>
  )
}
