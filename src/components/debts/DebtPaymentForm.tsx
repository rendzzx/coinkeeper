
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import * as LucideIcons from "lucide-react";
import { CalendarIcon, HelpCircle } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext } from "@/context/AppContext";
import { useSettings } from "@/context/SettingsContext";
import { useWallet } from "@/context/WalletContext";
import { cn, formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "../ui/scroll-area";
import { MultiSelect } from "../ui/multi-select";
import type { Transaction } from "@/lib/types";

const paymentSchema = z.object({
  debtId: z.string().min(1, { message: "Please select a debt or loan." }),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  walletId: z.string().min(1, { message: "Please select a wallet." }),
  date: z.date(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

type DebtPaymentFormProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export function DebtPaymentForm({ isOpen, setIsOpen }: DebtPaymentFormProps) {
  const { state, dispatch } = useAppContext();
  const { settings } = useSettings();
  const { wallets, walletTypes } = useWallet();
  const { t } = useTranslation();
  const { debts, tags } = state;
  const isMobile = useIsMobile();
  const [selectedDebtId, setSelectedDebtId] = useState<string | undefined>();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      debtId: "",
      amount: 0,
      walletId: "",
      date: new Date(),
      notes: "",
      tags: [],
    },
  });

  const selectedDebt = debts.find(d => d.id === selectedDebtId);
  const remainingAmount = selectedDebt ? selectedDebt.initialAmount - selectedDebt.paidAmount : 0;

  useEffect(() => {
    form.register("amount", {
      validate: value => value <= remainingAmount || `Amount cannot exceed remaining balance of ${formatCurrency(remainingAmount, settings.currency, false, settings.numberFormat, settings.decimalPlaces)}`
    });
  }, [remainingAmount, form, settings]);
  
  useEffect(() => {
    if (isOpen) {
        form.reset({
            debtId: "",
            amount: 0,
            walletId: "",
            date: new Date(),
            notes: "",
            tags: [],
        });
        setSelectedDebtId(undefined);
    }
  }, [isOpen, form]);
  
  useEffect(() => {
    const debtId = form.watch("debtId");
    setSelectedDebtId(debtId);
  }, [form.watch("debtId")]);


  const onSubmit = (data: PaymentFormValues) => {
    const debt = debts.find(d => d.id === data.debtId);
    if (!debt) return;

    const transactionType = debt.type === 'debt' ? 'expense' : 'income';
    const categoryId = debt.type === 'debt' ? 'sub-sys-debt-3' : 'sub-sys-debt-4';

    const transaction: Transaction = {
      id: uuidv4(),
      type: transactionType,
      amount: data.amount,
      walletId: data.walletId,
      categoryId,
      date: data.date.toISOString(),
      notes: data.notes || `Payment for ${debt.type} to/from ${debt.person}`,
      tags: data.tags || [],
      debtId: debt.id,
    };

    dispatch({ type: "ADD_DEBT_PAYMENT", payload: { debtId: debt.id, transaction } });
    setIsOpen(false);
  };
  
  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    field.onChange(numericValue === '' ? '' : Number(numericValue));
  };
  
  const handleCreateTag = (tagName: string) => {
    const newTag = { id: uuidv4(), name: tagName };
    dispatch({ type: "ADD_TAG", payload: newTag });
  };
  
  const tagOptions = tags.map(t => ({ value: t.name, label: t.name }));

  const activeDebts = debts.filter(d => d.status === 'active');

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
        <FormField
          control={form.control}
          name="debtId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('debt')}/{t('loan')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder={t('select')} /></SelectTrigger></FormControl>
                <SelectContent>
                  {activeDebts.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                        <div className="flex justify-between w-full">
                            <span>{d.person}</span>
                            <span className="text-muted-foreground ml-2">
                                {formatCurrency(d.initialAmount - d.paidAmount, settings.currency, false, settings.numberFormat, settings.decimalPlaces)}
                            </span>
                        </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
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
            name="walletId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('wallet')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
        </div>

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('date')}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
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
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('tags')}</FormLabel>
              <FormControl>
                <MultiSelect
                    options={tagOptions}
                    selected={field.value || []}
                    onChange={field.onChange}
                    placeholder={t('select')}
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
            <FormItem>
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

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{t('payDebtLoan')}</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="overflow-y-auto max-h-[70vh]">
            {formContent}
          </ScrollArea>
          <DrawerFooter className="pt-2">
            <Button onClick={form.handleSubmit(onSubmit)} className="w-full">{t('savePayment')}</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('payDebtLoan')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
            {formContent}
        </ScrollArea>
        <DialogFooter>
          <Button onClick={form.handleSubmit(onSubmit)} className="w-full">{t('savePayment')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
