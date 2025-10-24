
"use client"

import React, { useEffect } from "react"
import { Table } from "@tanstack/react-table"
import { X, Calendar as CalendarIcon, Filter, ArrowRightFromLine, CornerDownRight, HelpCircle } from "lucide-react"
import * as LucideIcons from "lucide-react";
import { DateRange } from "react-day-picker"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useAppContext } from "@/context/AppContext"
import { useWallet } from "@/context/WalletContext"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface TransactionFiltersProps<TData> {
  table: Table<TData>
}

export function TransactionFilters<TData>({
  table,
}: TransactionFiltersProps<TData>) {
  const { state } = useAppContext()
  const { wallets } = useWallet();
  const { t } = useTranslation()
  const { categories, tags } = state
  const isMobile = useIsMobile()

  const [date, setDate] = React.useState<DateRange | undefined>(
    (table.getColumn("date")?.getFilterValue() as DateRange) ?? undefined
  );
  const [minAmount, setMinAmount] = React.useState<string>('')
  const [maxAmount, setMaxAmount] = React.useState<string>('')
  const [isOpen, setIsOpen] = React.useState(!isMobile);
  
  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    const dateFilter = table.getColumn("date")?.getFilterValue() as DateRange | undefined;
    if (dateFilter) setDate(dateFilter);
  }, [table.getColumn("date")?.getFilterValue()]);


  const type = table.getColumn("type")?.getFilterValue() as string
  const categoryId = table.getColumn("category")?.getFilterValue() as string
  const walletId = table.getColumn("wallet")?.getFilterValue() as string
  const tag = table.getColumn("tags")?.getFilterValue() as string

  React.useEffect(() => {
    const dateColumn = table.getColumn("date");
    if (date) {
      dateColumn?.setFilterValue(date);
    } else {
      if(dateColumn?.getFilterValue()) {
        dateColumn.setFilterValue(undefined);
      }
    }
  }, [date, table]);


  React.useEffect(() => {
    const amountColumn = table.getColumn("amount");
    if (minAmount || maxAmount) {
        amountColumn?.setFilterValue([minAmount, maxAmount]);
    } else {
        if (amountColumn?.getFilterValue()) {
            amountColumn.setFilterValue(undefined);
        }
    }
  }, [minAmount, maxAmount, table]);

  const handleReset = () => {
    table.resetColumnFilters();
    // Also remove the query param from URL if it exists
    const newUrl = window.location.pathname;
    window.history.pushState({}, '', newUrl);
    setDate(undefined)
    setMinAmount('')
    setMaxAmount('')
  }
  
  const isFiltered = table.getState().columnFilters.length > 0;


  const filtersContent = (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 p-4 border rounded-lg">
        {/* Type Filter */}
        <Select value={type ?? ""} onValueChange={(value) => table.getColumn("type")?.setFilterValue(value)}>
            <SelectTrigger><SelectValue placeholder={t('type')} /></SelectTrigger>
            <SelectContent>
                <SelectItem value="income">{t('income')}</SelectItem>
                <SelectItem value="expense">{t('expense')}</SelectItem>
            </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select value={categoryId ?? ""} onValueChange={(value) => table.getColumn("category")?.setFilterValue(value)}>
            <SelectTrigger><SelectValue placeholder={t('category')} /></SelectTrigger>
            <SelectContent>
                {categories.map((category) => {
                    const CategoryIcon = (LucideIcons[category.icon as keyof typeof LucideIcons] as React.ElementType) || HelpCircle;
                    return (
                        <React.Fragment key={category.id}>
                            <SelectItem value={category.id} className="font-bold">
                                <div className="flex items-center gap-2">
                                    <ArrowRightFromLine className="h-4 w-4 text-muted-foreground" />
                                    <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                                    <span>{category.name}</span>
                                </div>
                            </SelectItem>
                            {category.subcategories.map((subCategory) => {
                                const SubCategoryIcon = (LucideIcons[subCategory.icon as keyof typeof LucideIcons] as React.ElementType) || HelpCircle;
                                return (
                                <SelectItem key={subCategory.id} value={subCategory.id}>
                                    <div className="flex items-center gap-2 pl-4">
                                        <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                                        <SubCategoryIcon className="h-4 w-4 text-muted-foreground" />
                                        <span>{subCategory.name}</span>
                                    </div>
                                </SelectItem>
                            )})}
                        </React.Fragment>
                )})}
            </SelectContent>
        </Select>
        
        {/* Wallet Filter */}
        <Select value={walletId ?? ""} onValueChange={(value) => table.getColumn("wallet")?.setFilterValue(value)}>
            <SelectTrigger><SelectValue placeholder={t('wallet')} /></SelectTrigger>
            <SelectContent>
                {wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
        </Select>

        {/* Tag Filter */}
        <Select value={tag ?? ""} onValueChange={(value) => table.getColumn("tags")?.setFilterValue(value)}>
            <SelectTrigger><SelectValue placeholder={t('tags')} /></SelectTrigger>
            <SelectContent>
                {tags.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
            </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn( "justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                        date.to ? (
                        <>
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                        </>
                        ) : (
                        format(date.from, "LLL dd, y")
                        )
                    ) : (
                        <span>{t('pickADate')}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                />
            </PopoverContent>
        </Popover>
        
        {/* Amount Range Filter */}
        <div className="flex items-center gap-2 xl:col-span-2">
            <Input
                placeholder={t('minAmount')}
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="h-10"
            />
            <Input
                placeholder={t('maxAmount')}
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="h-10"
            />
        </div>
        
        {isFiltered && (
            <div className="xl:col-span-full">
                <Button onClick={handleReset} variant="ghost" className="h-10 w-full">
                    <X className="mr-2 h-4 w-4" />
                    Reset
                </Button>
            </div>
        )}
    </div>
  );

  if (isMobile) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {isFiltered && <span className="ml-2 h-2 w-2 rounded-full bg-primary" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {filtersContent}
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return filtersContent;
}
