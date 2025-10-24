
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { Trash2, CalendarIcon, Info, Upload, X as XIcon, Image as ImageIcon, BellRing, TestTube2, Link as LinkIcon, HelpCircle, Unlink, AlertCircle } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
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
import type { Debt, Attachment, Transaction } from "@/lib/types";
import { useAppContext } from "@/context/AppContext";
import { useSettings } from "@/context/SettingsContext";
import { useWallet } from "@/context/WalletContext";
import { useTransaction } from "@/context/TransactionContext";
import { toast } from "@/hooks/use-toast-internal";
import { useTranslation } from "@/hooks/use-translation";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "../ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn, formatCurrency } from "@/lib/utils";
import { Calendar } from "../ui/calendar";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { Switch } from "../ui/switch";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { MultiSelect } from "../ui/multi-select";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  dataUrl: z.string(),
});

const debtSchema = z.object({
  person: z.string().min(1, { message: "Please enter the person's name." }),
  type: z.enum(['debt', 'loan']),
  initialAmount: z.coerce.number().positive({ message: "Amount must be positive." }),
  startDate: z.date(),
  dueDate: z.date().optional().nullable(),
  notes: z.string().optional(),
  attachments: z.array(attachmentSchema).optional(),
  enableNotifications: z.boolean().optional(),
  walletId: z.string().min(1, { message: "Please select a wallet." }),
  sourceTransactionId: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).refine(data => {
  if (!data.dueDate) return true;
  const start = new Date(data.startDate);
  const due = new Date(data.dueDate);
  start.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due >= start;
}, {
  message: "Due date must be the same or after start date.",
  path: ["dueDate"],
});

type DebtFormValues = z.infer<typeof debtSchema>;

type DebtFormProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  debt?: Debt;
};

export function DebtForm({ isOpen, setIsOpen, debt }: DebtFormProps) {
  const { state, dispatch } = useAppContext();
  const { settings } = useSettings();
  const { transactions } = useTransaction();
  const { wallets, walletTypes } = useWallet();
  const { categories, tags } = state;
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [showDueDate, setShowDueDate] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [isLinkTxOpen, setIsLinkTxOpen] = useState(false);

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      person: "",
      type: "debt",
      initialAmount: 0,
      startDate: new Date(),
      dueDate: null,
      notes: "",
      attachments: [],
      enableNotifications: false,
      walletId: "",
      sourceTransactionId: undefined,
      tags: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (debt) {
        setShowDueDate(!!debt.dueDate);
        form.reset({
          person: debt.person,
          type: debt.type,
          initialAmount: debt.initialAmount,
          startDate: new Date(debt.startDate),
          dueDate: debt.dueDate ? new Date(debt.dueDate) : null,
          notes: debt.notes || "",
          attachments: debt.attachments || [],
          enableNotifications: debt.enableNotifications || false,
          walletId: debt.walletId,
          sourceTransactionId: debt.sourceTransactionId,
          tags: debt.tags || [],
        });
      } else {
        setShowDueDate(false);
        form.reset({
          person: "",
          type: "debt",
          initialAmount: 0,
          startDate: new Date(),
          dueDate: null,
          notes: "",
          attachments: [],
          enableNotifications: true,
          walletId: "",
          sourceTransactionId: undefined,
          tags: [],
        });
      }
    }
  }, [debt, isOpen, form]);

  const onSubmit = (data: DebtFormValues) => {
    if (debt) {
      // When editing, only update fields that are allowed to be changed.
      const updatedDebt: Debt = {
        ...debt,
        person: data.person,
        startDate: data.startDate.toISOString(),
        dueDate: showDueDate && data.dueDate ? data.dueDate.toISOString() : null,
        enableNotifications: data.enableNotifications,
      }
      dispatch({ type: "UPDATE_DEBT", payload: updatedDebt });
    } else {
      const debtData: Debt = {
        ...data,
        id: uuidv4(),
        paidAmount: 0,
        status: 'active',
        linkedTransactionIds: [],
        startDate: data.startDate.toISOString(),
        dueDate: showDueDate && data.dueDate ? data.dueDate.toISOString() : null,
        notes: data.notes || '',
        attachments: data.attachments || [],
        enableNotifications: data.enableNotifications,
        walletId: data.walletId,
        sourceTransactionId: data.sourceTransactionId,
        tags: data.tags || [],
      }
      dispatch({ type: "ADD_DEBT", payload: debtData });
    }
    setIsOpen(false);
  };
  
  const handleDelete = () => {
    if (!debt) return;
    dispatch({ type: "DELETE_DEBT", payload: debt.id });
    setIsOpen(false);
  };
  
  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    field.onChange(numericValue === '' ? '' : Number(numericValue));
  };
  
  const handleAttachmentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({
                variant: 'destructive',
                title: 'File too large',
                description: `"${file.name}" exceeds the 5MB size limit.`
            });
            continue;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const newAttachment: Attachment = {
                id: uuidv4(),
                name: file.name,
                type: file.type,
                dataUrl: dataUrl
            };
            const currentAttachments = form.getValues("attachments") || [];
            form.setValue("attachments", [...currentAttachments, newAttachment]);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleRemoveAttachment = (id: string) => {
      const currentAttachments = form.getValues("attachments") || [];
      form.setValue("attachments", currentAttachments.filter(att => att.id !== id));
  };

  const handleTestNotification = () => {
    if (Notification.permission === 'granted' && debt && debt.dueDate) {
      const remaining = debt.initialAmount - debt.paidAmount;
      new Notification(t('debtOverdue'), {
        body: t('debtOverdueBody', { person: debt.person, amount: formatCurrency(remaining, settings.currency, false, settings.numberFormat, settings.decimalPlaces) }),
      });
    }
  };
  
  const handleLinkTransaction = (tx: Transaction) => {
    form.setValue('initialAmount', tx.amount);
    form.setValue('startDate', new Date(tx.date));
    form.setValue('notes', tx.notes);
    form.setValue('attachments', tx.attachments || []);
    form.setValue('sourceTransactionId', tx.id);
    form.setValue('type', tx.type === 'income' ? 'debt' : 'loan');
    form.setValue('walletId', tx.walletId);
    form.setValue('tags', tx.tags);
    setIsLinkTxOpen(false);
  }

  const handleUnlinkTransaction = () => {
    form.reset({
      person: "",
      type: "debt",
      initialAmount: 0,
      startDate: new Date(),
      dueDate: null,
      notes: "",
      attachments: [],
      enableNotifications: true,
      walletId: "",
      sourceTransactionId: undefined,
      tags: [],
    });
    setShowDueDate(false);
  };

  const getTitle = () => {
    if (!debt) return t('addDebt');
    return debt.type === 'debt' ? t('editDebt') : t('editLoan');
  }
  
  const initialBalanceCategory = categories.find(c => c.id === 'sys-initial');
  const unlinkedTransactions = transactions.filter(tx => !tx.debtId && tx.categoryId !== initialBalanceCategory?.id);

  const tagOptions = tags.map(tag => ({ value: tag.name, label: tag.name }));
  const handleCreateTag = (tagName: string) => {
    const newTag = { id: uuidv4(), name: tagName };
    dispatch({ type: "ADD_TAG", payload: newTag });
  };
  
  const isLinked = !!form.watch("sourceTransactionId");

  const linkButton = (
    !debt && (isLinked ? (
        <div className="w-full">
            <div className="p-3 border rounded-md bg-muted/50 text-sm flex items-center justify-between">
                <p className="text-muted-foreground">
                    {t('linkedToTransaction')}: <span className="font-mono text-xs text-foreground">{form.watch("sourceTransactionId")}</span>
                </p>
                <Button variant="link" size="sm" onClick={handleUnlinkTransaction} className="p-0 h-auto">
                    <Unlink className="mr-2 h-4 w-4" />
                    {t('unlink')}
                </Button>
            </div>
        </div>
    ) : (
        <Dialog open={isLinkTxOpen} onOpenChange={setIsLinkTxOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    {t('linkToTransaction')}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('linkToTransaction')}</DialogTitle>
                    <DialogDescription>{t('linkToTransactionDescription')}</DialogDescription>
                </DialogHeader>
                <Command>
                    <CommandInput placeholder={t('searchTransactions')} />
                    <CommandList>
                        <CommandEmpty>{t('noTransactionsFound')}</CommandEmpty>
                        <CommandGroup>
                            {unlinkedTransactions.map(tx => (
                                <CommandItem key={tx.id} onSelect={() => handleLinkTransaction(tx)} className="cursor-pointer">
                                    <div className="flex justify-between w-full">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{tx.notes || 'No notes'}</span>
                                            <span className="text-xs text-muted-foreground">{format(new Date(tx.date), "PP")} - {wallets.find(w=>w.id === tx.walletId)?.name}</span>
                                        </div>
                                        <span className={cn("font-semibold", tx.type === 'income' ? 'text-green-600' : 'text-red-600')}>
                                            {formatCurrency(tx.amount, settings.currency, false, settings.numberFormat, settings.decimalPlaces)}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    ))
  );

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
        {debt && (
             <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>This is a linked record.</AlertTitle>
                <AlertDescription className="space-y-2">
                    <p className="font-mono text-xs bg-muted p-2 rounded-md">Transaction ID: {debt.sourceTransactionId}</p>
                    <p>You can only edit notification and due date settings here. To edit amount or notes, please edit the original transaction.</p>
                </AlertDescription>
            </Alert>
        )}
        {linkButton}
        
        <fieldset disabled={!!debt}>
            <FormField
            control={form.control}
            name="person"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{form.watch('type') === 'debt' ? t('whoIOwe') : t('whoOwesMe')}</FormLabel>
                <FormControl>
                    <Input placeholder={t('egJohnDoe')} {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </fieldset>
        
        <fieldset disabled={isLinked || !!debt}>
          <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>{t('type')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger disabled={isLinked || !!debt}><SelectValue placeholder={t('select')} /></SelectTrigger></FormControl>
                      <SelectContent>
                          <SelectItem value="debt">{t('debt')} <span className="text-muted-foreground ml-1">{t('debtDescription')}</span></SelectItem>
                          <SelectItem value="loan">{t('loan')} <span className="text-muted-foreground ml-1">{t('loanDescription')}</span></SelectItem>
                      </SelectContent>
                  </Select>
                  <FormMessage />
                  </FormItem>
              )}
          />
          <FormField
            control={form.control}
            name="initialAmount"
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
                      <FormControl><SelectTrigger disabled={isLinked || !!debt}><SelectValue placeholder={t('select')} /></SelectTrigger></FormControl>
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
                        disabled={true}
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
            <FormField
                control={form.control}
                name="attachments"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('attachments')}</FormLabel>
                        <FormControl>
                            <div>
                                <input
                                    type="file"
                                    ref={attachmentInputRef}
                                    onChange={handleAttachmentUpload}
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                />
                                <Button type="button" variant="outline" onClick={() => attachmentInputRef.current?.click()} className="w-full">
                                    <Upload className="mr-2 h-4 w-4" /> {t('uploadAttachment')}
                                </Button>
                            </div>
                        </FormControl>
                        {field.value && field.value.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                {field.value.map(attachment => (
                                    <div key={attachment.id} className="relative group">
                                        <div className="aspect-square rounded-md overflow-hidden border">
                                            {attachment.type.startsWith('image/') ? (
                                                <Image src={attachment.dataUrl} alt={attachment.name} width={100} height={100} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full bg-muted p-2">
                                                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                                    <p className="text-xs text-center text-muted-foreground mt-1 truncate">{attachment.name}</p>
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleRemoveAttachment(attachment.id)}
                                        >
                                            <XIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <FormMessage />
                    </FormItem>
                )}
            />
        </fieldset>
        
        <div className="grid grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                        <FormLabel>{t('startDate')}</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild disabled={!!debt}>
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
            
            <div className="flex flex-col pt-2">
                <div className="flex items-center space-x-2 mb-2 pt-1">
                    <Checkbox id="show-due-date" checked={showDueDate} onCheckedChange={(checked) => setShowDueDate(checked as boolean)} />
                    <Label htmlFor="show-due-date" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t('dueDate')}
                      <TooltipProvider>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>{t('dueDateTooltip')}</p>
                              </TooltipContent>
                          </Tooltip>
                      </TooltipProvider>
                    </Label>
                </div>
                {showDueDate && (
                    <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
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
                                <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>
        </div>

        {showDueDate && (
          <FormField
              control={form.control}
              name="enableNotifications"
              render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2">
                          <BellRing className="h-4 w-4" /> {t('dueNotification')}
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
        )}


        {settings.devMode && debt && debt.dueDate && (
          <Button type="button" variant="outline" onClick={handleTestNotification}>
            <TestTube2 className="mr-2 h-4 w-4" />
            {t('testDueDateNotification')}
          </Button>
        )}
      </form>
    </Form>
  );
  
  const deleteButton = debt && (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="destructive" className="w-full">
            <Trash2 className="mr-2 h-4 w-4" />
            {t('delete')}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDebtWarning')}
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

  const footerButtons = (
     <div className="flex flex-col-reverse sm:flex-row gap-2 w-full">
        {debt && <div className="flex-1">{deleteButton}</div>}
        <Button onClick={form.handleSubmit(onSubmit)} className="w-full flex-1">{t('save')}</Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{getTitle()}</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="overflow-y-auto max-h-[70vh]">
            {formContent}
          </ScrollArea>
          <DrawerFooter className="pt-2 flex-col-reverse gap-2">
            {footerButtons}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
            {formContent}
        </ScrollArea>
        <DialogFooter className="pt-4">
            {footerButtons}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
