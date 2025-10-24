
"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Filter } from "lucide-react"
import { DateRange } from "react-day-picker"
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useIsMobile } from "@/hooks/use-mobile"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useTranslation } from "@/hooks/use-translation"

type ReportFiltersProps = {
    selectedRange: DateRange | undefined;
    onDateChange: (range: DateRange | undefined) => void;
    className?: string;
}

export function ReportFilters({ selectedRange, onDateChange, className }: ReportFiltersProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = React.useState(!isMobile);

  React.useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  const handlePresetChange = (value: string) => {
    const now = new Date();
    switch (value) {
      case "this-month":
        onDateChange({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case "last-3-months":
        onDateChange({ from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) });
        break;
      case "this-year":
        onDateChange({ from: startOfYear(now), to: endOfYear(now) });
        break;
      default:
        onDateChange(undefined);
        break;
    }
  }
  
  const filtersContent = (
    <div className={cn("flex flex-col sm:flex-row items-center gap-2", className)}>
        <Select onValueChange={handlePresetChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('selectAPreset')} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="this-month">{t('thisMonth')}</SelectItem>
                <SelectItem value="last-3-months">{t('last3Months')}</SelectItem>
                <SelectItem value="this-year">{t('thisYear')}</SelectItem>
            </SelectContent>
        </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full sm:w-[300px] justify-start text-left font-normal",
              !selectedRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedRange?.from ? (
              selectedRange.to ? (
                <>
                  {format(selectedRange.from, "LLL dd, y")} -{" "}
                  {format(selectedRange.to, "LLL dd, y")}
                </>
              ) : (
                format(selectedRange.from, "LLL dd, y")
              )
            ) : (
              <span>{t('pickADate')}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={selectedRange?.from}
            selected={selectedRange}
            onSelect={onDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )

  if (isMobile) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full">
            <Filter className="mr-2 h-4 w-4" />
            {t('dateFilters')}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          {filtersContent}
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return filtersContent;
}
