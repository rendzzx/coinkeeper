

"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { Trash2, HelpCircle, CornerDownRight, ArrowRightFromLine, CalendarIcon, Info } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { format, setHours, setMinutes, setSeconds } from 'date-fns';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { ScheduledTransaction } from "@/lib/types";
import { useAppContext } from "@/context/AppContext";
import { useWallet } from "@/context/WalletContext";
import { toast } from "@/hooks/use-toast-internal";
import { useTranslation } from "@/hooks/use-translation";
import { MultiSelect, type MultiSelectOption } from "../ui/multi-select";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { useScheduledTransaction } from "@/context/ScheduledTransactionContext";

const scheduledTransactionSchema = z.object({
  name: z.string().min(1, { message: "Please enter a name for the schedule." }),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  type: z.enum(["income", "expense"]),
  walletId: z.string().min(1, { message: "Please select a wallet." }),
  categoryId: z.string().min(1, { message: "Please select a category." }),
  startDate: z.date(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, "Invalid time format (HH:mm:ss)"),
  frequency: z.enum(['once', 'daily', 'weekly', 'monthly', 'yearly']),
  endDate: z.date().optional().nullable(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).refine(data => !data.endDate || data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type ScheduledTransactionFormValues = z.infer<typeof scheduledTransactionSchema>;

type ScheduledTransactionFormProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  schedule?: ScheduledTransaction;
};

export function ScheduledTransactionForm({ isOpen, setIsOpen, schedule }: ScheduledTransactionFormProps) {
  const { state, dispatch } = useAppContext();
  const { wallets, walletTypes } = useWallet();
  const { addScheduledTransaction, updateScheduledTransaction, deleteScheduledTransaction } = useScheduledTransaction();
  const { t } = useTranslation();
  const { categories, tags } = state;
  const isMobile = useIsMobile();
  const [showEndDate, setShowEndDate] = useState(false);

  const form = useForm<ScheduledTransactionFormValues>({
    resolver: zodResolver(scheduledTransactionSchema),
    defaultValues: {
      name: "",
      amount: 0,
      type: "expense",
      walletId: "",
      categoryId: "",
      startDate: new Date(),
      time: format(new Date(), "HH:mm:ss"),
      frequency: "monthly",
      endDate: null,
      notes: "",
      tags: [],
    },
  });

  const frequency = form.watch('frequency');
  const isCompleted = schedule?.status === 'completed';
  const isLocked = schedule?.locked ?? false;

  useEffect(() => {
    if (isOpen) {
      if (schedule) {
        setShowEndDate(!!schedule.endDate);
        form.reset({
          ...schedule,
          startDate: new Date(schedule.startDate),
          endDate: schedule.endDate ? new Date(schedule.endDate) : null,
          time: schedule.time || format(new Date(schedule.startDate), "HH:mm:ss"),
        });
      } else {
        setShowEndDate(false);
        form.reset({
          name: "",
          amount: 0,
          type: "expense",
          walletId: "",
          categoryId: "",
          startDate: new Date(),
          time: format(new Date(), "HH:mm:ss"),
          frequency: "monthly",
          endDate: null,
          notes: "",
          tags: [],
        });
      }
    }
  }, [schedule, isOpen, form]);

  useEffect(() => {
    if (frequency === 'once') {
      setShowEndDate(false);
      form.setValue('endDate', null);
    }
  }, [frequency, form]);

  const onSubmit = (data: ScheduledTransactionFormValues) => {
    const [hours, minutes, seconds] = data.time.split(':').map(Number);
    let startDateWithTime = setHours(data.startDate, hours);
    startDateWithTime = setMinutes(startDateWithTime, minutes);
    startDateWithTime = setSeconds(startDateWithTime, seconds || 0);

    const scheduleData = {
      ...data,
      startDate: startDateWithTime.toISOString(),
      endDate: showEndDate && data.endDate ? data.endDate.toISOString() : null,
      tags: data.tags || [],
      notes: data.notes || '',
    };
    
    if (schedule) {
      updateScheduledTransaction({ ...schedule, ...scheduleData });
      toast({ title: t('toastScheduleUpdated') });
    } else {
      addScheduledTransaction(scheduleData);
      toast({ title: t('toastScheduleAdded') });
    }
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (!schedule) return;
    deleteScheduledTransaction(schedule.id);
    toast({ title: t('scheduleDeleted'), description: t('scheduleDeletedDescription', { name: schedule.name }) });
    setIsOpen(false);
  };

  const filteredCategories = categories.filter(c => !c.isSystem && (c.type === form.watch("type") || c.type === 'all'));
  const tagOptions: MultiSelectOption[] = tags.map(t => ({ value: t.name, label: t.name }));

  const handleCreateTag = (tagName: string) => {
    const newTag = { id: uuidv4(), name: tagName };
    dispatch({ type: "ADD_TAG", payload: newTag });
  };
  
  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    field.onChange(numericValue === '' ? '' : Number(numericValue));
  };

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="px-4 space-y-4">
        <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('scheduleName')}</FormLabel>
                <FormControl>
                    <Input placeholder={t('egFoodDrink')} {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <fieldset disabled={isLocked || isCompleted} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('amount')}</FormLabel>
                <FormControl>
                    <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={field.value === 0 ? '' : field.value}
                    onChange={(e) => handleNumericInputChange(e, field)}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('type')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isLocked || isCompleted}>
                    <FormControl><SelectTrigger><SelectValue placeholder={t('select')} /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="expense">{t('expense')}</SelectItem>
                        <SelectItem value="income">{t('income')}</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
          />

          <FormField
              control={form.control}
              name="walletId"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>{t('wallet')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLocked || isCompleted}>
                      <FormControl><SelectTrigger><SelectValue placeholder={t('select')} /></SelectTrigger></FormControl>
                      <SelectContent>
                      {wallets.map(w => {
                          const walletType = walletTypes.find(wt => wt.id === w.typeId);
                          const Icon = walletType ? (LucideIcons[walletType.icon as keyof typeof LucideIcons] as React.ElementType) || HelpCircle : HelpCircle;
                          return (
                              <SelectItem key={w.id} value={w.id}>
                                  <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: w.color }} />
                                      <Icon className="h-4 w-4 text-muted-foreground" />
                                      <span>{w.name}</span>
                                  </div>
                              </SelectItem>
                          )
                      })}
                      </SelectContent>
                  </Select>
                  <FormMessage />
                  </FormItem>
              )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('category')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isLocked || isCompleted}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectACategory')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredCategories.map((category) => {
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                  <FormLabel>{t('frequency')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLocked || isCompleted}>
                      <FormControl><SelectTrigger><SelectValue placeholder={t('select')} /></SelectTrigger></FormControl>
                      <SelectContent>
                          <SelectItem value="once">{t('once')}</SelectItem>
                          <SelectItem value="daily">{t('daily')}</SelectItem>
                          <SelectItem value="weekly">{t('weekly')}</SelectItem>
                          <SelectItem value="monthly">{t('monthly')}</SelectItem>
                          <SelectItem value="yearly">{t('yearly')}</SelectItem>
                      </SelectContent>
                  </Select>
                  <FormMessage />
                  </FormItem>
              )}
          />

          <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                  <FormItem className="flex flex-col">
                      <div className="flex items-center gap-2">
                          <FormLabel>{t('startDate')}</FormLabel>
                          <TooltipProvider>
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                      <p>{t('startDateTooltip')}</p>
                                  </TooltipContent>
                              </Tooltip>
                          </TooltipProvider>
                      </div>
                      <Popover>
                          <PopoverTrigger asChild>
                          <FormControl>
                              <Button
                              variant={"outline"}
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                              >
                              {field.value ? format(field.value, "PPP") : <span>{t('pickADate')}</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                          </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                      </Popover>
                  <FormMessage />
                  </FormItem>
              )}
          />
          <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                  <FormItem className="flex flex-col">
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                          <Input type="time" step="1" {...field} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
              )}
          />
        </fieldset>
        
        {frequency !== 'once' && (
        <div className="sm:col-span-2">
            <div className="flex items-center space-x-2 mb-2">
                <Checkbox id="show-end-date" checked={showEndDate} onCheckedChange={(checked) => setShowEndDate(checked as boolean)} />
                <Label htmlFor="show-end-date" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t('endDate')}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('endDateTooltip')}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </Label>
            </div>
            {showEndDate && (
                <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                {field.value ? format(field.value, "PPP") : <span>{t('noEndDate')}</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}
        </div>
        )}
        
        <FormField
        control={form.control}
        name="tags"
        render={({ field }) => (
            <FormItem className="sm:col-span-2">
            <FormLabel>{t('tags')}</FormLabel>
            <FormControl>
                <MultiSelect
                    options={tagOptions}
                    selected={field.value || []}
                    onChange={field.onChange}
                    placeholder={t('tags')}
                    handleCreate={handleCreateTag}
                />
            </FormControl>
            <FormMessage />
            </FormItem>
        )}
        />
        <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
            <FormItem className="sm:col-span-2">
            <FormLabel>{t('notes')}</FormLabel>
            <FormControl>
                <Textarea placeholder={t('optionalNotes')} {...field} />
            </FormControl>
            <FormMessage />
            </FormItem>
        )}
        />
      </form>
    </Form>
  );

  const deleteButton = schedule && (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="destructive" className={isMobile ? "w-full" : ""}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('delete')}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteScheduleWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{schedule ? t('editScheduledTransaction') : t('addScheduledTransaction')}</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="overflow-y-auto max-h-[70vh]">
            {formContent}
          </ScrollArea>
          <DrawerFooter className="pt-2 flex-col-reverse gap-2">
            {deleteButton}
            {!isCompleted && <Button onClick={form.handleSubmit(onSubmit)} className="w-full">{t('saveSchedule')}</Button>}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{schedule ? t('editScheduledTransaction') : t('addScheduledTransaction')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6 -mr-6">
            <div className="pr-6">
                {formContent}
            </div>
        </ScrollArea>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-4">
            {schedule && <div className="flex-1">{deleteButton}</div>}
            {!isCompleted && <Button onClick={form.handleSubmit(onSubmit)} className="w-full">{t('saveSchedule')}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
