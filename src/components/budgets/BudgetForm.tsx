

"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { Trash2, HelpCircle, CornerDownRight, ArrowRightFromLine, CalendarIcon, BellRing } from "lucide-react";
import * as LucideIcons from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Budget } from "@/lib/types";
import { useAppContext } from "@/context/AppContext";
import { useTranslation } from "@/hooks/use-translation";
import { MultiSelect, type MultiSelectOption } from "../ui/multi-select";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { format, startOfDay } from 'date-fns';
import { useToast } from "@/hooks/use-toast-internal";
import { Switch } from "../ui/switch";

const budgetSchema = z.object({
  name: z.string().min(1, { message: "Please enter a name for the budget." }),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  type: z.enum(['periodic', 'one-time']),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  enableNotifications: z.boolean().optional(),
}).refine(data => data.categoryId || (data.tags && data.tags.length > 0), {
  message: "Please select at least one category or tag.",
  path: ["categoryId"],
}).refine(data => {
    if (data.type === 'one-time') {
        return !!data.startDate && !!data.endDate;
    }
    return true;
}, {
    message: "Start date and end date are required for one-time budgets.",
    path: ["startDate"],
}).refine(data => {
    if (data.type === 'one-time' && data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
    }
    return true;
}, {
    message: "End date cannot be before start date.",
    path: ["endDate"],
});


type BudgetFormValues = z.infer<typeof budgetSchema>;

type BudgetFormProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  budget?: Budget;
  defaultType?: 'periodic' | 'one-time';
};


export function BudgetForm({ isOpen, setIsOpen, budget, defaultType = 'periodic' }: BudgetFormProps) {
  const { state, dispatch } = useAppContext();
  const { t } = useTranslation();
  const { categories, tags } = state;
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: "",
      categoryId: undefined,
      tags: [],
      amount: 0,
      type: 'periodic',
      startDate: undefined,
      endDate: undefined,
      enableNotifications: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (budget) {
        form.reset({
          ...budget,
          categoryId: budget.categoryIds.length > 0 ? budget.categoryIds[0] : undefined,
          startDate: budget.startDate ? new Date(budget.startDate) : undefined,
          endDate: budget.endDate ? new Date(budget.endDate) : undefined,
          enableNotifications: budget.enableNotifications ?? true,
        });
      } else {
        form.reset({
          name: "",
          categoryId: undefined,
          tags: [],
          amount: 0,
          type: defaultType,
          startDate: undefined,
          endDate: undefined,
          enableNotifications: true,
        });
      }
    }
  }, [budget, isOpen, form, defaultType]);

  const onSubmit = (data: BudgetFormValues) => {
    const budgetData: Budget = {
      ...data,
      id: budget?.id || uuidv4(),
      categoryIds: data.categoryId ? [data.categoryId] : [],
      tags: data.tags || [],
      startDate: data.startDate ? startOfDay(data.startDate).toISOString() : undefined,
      endDate: data.endDate ? startOfDay(data.endDate).toISOString() : undefined,
      enableNotifications: data.enableNotifications,
    };
    if (budget) {
      dispatch({ type: "UPDATE_BUDGET", payload: budgetData });
      toast({ title: t('toastBudgetUpdated') });
    } else {
      dispatch({ type: "ADD_BUDGET", payload: budgetData });
      toast({ title: t('toastBudgetAdded') });
    }
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (!budget) return;
    dispatch({ type: "DELETE_BUDGET", payload: budget.id });
    toast({ title: t('toastBudgetDeleted'), description: t('toastBudgetDeletedDesc', { budgetName: budget.name }) });
    setIsOpen(false);
  };

  const expenseCategories = categories.filter(c => c.type === 'expense' && !c.isSystem);
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
  
  const budgetType = form.watch('type');

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
        <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem className="w-full">
                <FormControl>
                    <Tabs
                        value={field.value}
                        onValueChange={(value) => field.onChange(value as 'periodic' | 'one-time')}
                        className="w-full"
                        >
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="periodic">{t('monthly')}</TabsTrigger>
                            <TabsTrigger value="one-time">{t('one-time')}</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </FormControl>
                </FormItem>
            )}
        />
        {budgetType === 'one-time' && (
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>{t('startDate')}</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
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
                name="endDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>{t('endDate')}</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
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
            </div>
        )}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('egFoodDrink')} {...field} />
              </FormControl>
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
               <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={t('selectACategory')} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {expenseCategories.map((category) => {
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('budgetAmount')}</FormLabel>
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
            name="enableNotifications"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-2">
                        <BellRing className="h-4 w-4" /> {t('budgetAlert')}
                    </FormLabel>
                    <FormMessage />
                </div>
                <FormControl>
                    <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    />
                </FormControl>
                </FormItem>
            )}
        />
      </form>
    </Form>
  );

  const deleteButton = budget && (
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
              {t('deleteBudgetWarning')}
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
            <DrawerTitle>{budget ? t('editBudget') : t('addBudget')}</DrawerTitle>
            <DrawerDescription>
                {budget ? t('updateBudgetDetails') : t('setNewBudgetForCategory')}
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="overflow-y-auto max-h-[70vh]">
            {formContent}
          </ScrollArea>
          <DrawerFooter className="pt-2 flex-col-reverse gap-2">
            {deleteButton}
            <Button onClick={form.handleSubmit(onSubmit)} className="w-full">{t('save')}</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{budget ? t('editBudget') : t('addBudget')}</DialogTitle>
          <DialogDescription>
            {budget ? t('updateBudgetDetails') : t('setNewBudgetForCategory')}
          </DialogDescription>
        </DialogHeader>
        {formContent}
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-4">
            {budget && <div className="flex-1">{deleteButton}</div>}
            <Button onClick={form.handleSubmit(onSubmit)} className="w-full">{t('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
