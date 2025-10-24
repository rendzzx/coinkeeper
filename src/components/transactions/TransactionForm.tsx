

"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { CalendarIcon, HelpCircle, CornerDownRight, ArrowRightFromLine, ArrowRightLeft, AlertCircle, Upload, X as XIcon, Image as ImageIcon, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { format, setHours, setMinutes, setSeconds } from "date-fns";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import type { Transaction, Attachment, Category, Wallet } from "@/lib/types";
import { useAppContext } from "@/context/AppContext";
import { useTransaction } from "@/context/TransactionContext";
import { useWallet } from "@/context/WalletContext";
import { cn, formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "../ui/scroll-area";
import { MultiSelect } from "../ui/multi-select";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "@/hooks/use-toast-internal";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { WalletForm } from "../wallets/WalletForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  dataUrl: z.string(),
});

const createTransactionSchema = (t: (key: any) => string) => z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  walletId: z.string().min(1, { message: "Please select a wallet." }),
  categoryId: z.string().min(1, { message: "Please select a category." }),
  date: z.date(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, "Invalid time format (HH:mm:ss)"),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  attachments: z.array(attachmentSchema).optional(),
});

const transferSchema = z.object({
  fromWalletId: z.string().min(1, { message: "Please select a source wallet." }),
  toWalletId: z.string().min(1, { message: "Please select a destination wallet." }),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  date: z.date(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, "Invalid time format (HH:mm:ss)"),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).refine(data => data.fromWalletId !== data.toWalletId, {
    message: "Source and destination wallets cannot be the same.",
    path: ["toWalletId"],
});


type TransactionFormValues = z.infer<ReturnType<typeof createTransactionSchema>>;
type TransferFormValues = z.infer<typeof transferSchema>;


type TransactionFormProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  transaction?: Transaction;
};

export function TransactionForm({ isOpen, setIsOpen, transaction }: TransactionFormProps) {
  const { state, dispatch } = useAppContext();
  const { addTransaction, updateTransaction, deleteTransaction, addTransfer } = useTransaction();
  const { wallets, walletTypes } = useWallet();
  const { t } = useTranslation();
  const { categories, tags } = state;
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"expense" | "income" | "transfer">("expense");
  const [isWalletFormOpen, setIsWalletFormOpen] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!transaction;
  const isEditingTransfer = isEditing && !!transaction?.transferId;
  const isLocked = isEditing && (!!transaction.debtId || !!transaction.transferId || categories.find(c => c.id === transaction.categoryId)?.isSystem);
  
  const transactions = useTransaction().transactions; // Get it from context
  const getLockedReason = () => {
    if (!isEditing) return null;
    if (transaction.debtId) return 'debt';
    if (transaction.transferId) return 'transfer';
    const txCategory = categories.find(c => c.id === transaction.categoryId || c.subcategories.some(sc => sc.id === transaction.categoryId));
    if (txCategory?.isSystem) return 'system';
    return null;
  };
  const lockedReason = getLockedReason();


  const transactionSchema = useMemo(() => createTransactionSchema(t), [t]);

  const transactionForm = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: "expense", notes: "", tags: [], amount: 0, attachments: [] },
  });

  const transferForm = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { fromWalletId: "", toWalletId: "", notes: "", tags: [], amount: 0 },
  });
  
  useEffect(() => {
    if (isOpen) {
        const now = new Date();
        const defaultTime = format(now, "HH:mm:ss");
        
        if (transaction) {
            const transactionDate = new Date(transaction.date);
            const currentTab = transaction.type as "income" | "expense";
            
            if (transaction.transferId) {
                setActiveTab("transfer");
                const otherSide = transactions.find(t => t.id === transaction.transferId);
                if (otherSide) {
                    const fromTransaction = transaction.type === 'expense' ? transaction : otherSide;
                    const toTransaction = transaction.type === 'income' ? transaction : otherSide;
                    transferForm.reset({
                        fromWalletId: fromTransaction.walletId,
                        toWalletId: toTransaction.walletId,
                        amount: transaction.amount,
                        date: transactionDate,
                        time: format(transactionDate, "HH:mm:ss"),
                        notes: transaction.notes?.startsWith('Transfer to') || transaction.notes?.startsWith('Transfer from') ? '' : transaction.notes,
                        tags: transaction.tags,
                    });
                }
            } else {
                 setActiveTab(currentTab);
                 transactionForm.reset({
                    type: transaction.type,
                    amount: transaction.amount,
                    walletId: transaction.walletId,
                    categoryId: transaction.categoryId,
                    date: transactionDate,
                    time: format(transactionDate, "HH:mm:ss"),
                    notes: transaction.notes,
                    tags: transaction.tags,
                    attachments: transaction.attachments || [],
                });
            }
        } else {
             setActiveTab('expense');
            transactionForm.reset({
                type: 'expense',
                amount: 0,
                walletId: "",
                categoryId: "",
                date: now,
                time: defaultTime,
                notes: "",
                tags: [],
                attachments: [],
            });
            transferForm.reset({
                fromWalletId: "",
                toWalletId: "",
                amount: 0,
                date: now,
                time: defaultTime,
                notes: "",
                tags: [],
            });
        }
    }
  }, [isOpen, transaction, transactionForm, transferForm, transactions]);


  useEffect(() => {
    if (activeTab !== 'transfer') {
        transactionForm.setValue('type', activeTab);
    }
  }, [activeTab, transactionForm]);

  const handleDeleteSubmit = () => {
    if (!transaction) return;
    deleteTransaction(transaction.id);
    setIsOpen(false);
    toast({ title: t('toastTransactionDeleted'), description: t('toastTransactionDeletedDesc') });
  }

  const onTransactionSubmit = (data: TransactionFormValues) => {
    if (data.type === 'expense') {
        const wallet = wallets.find(w => w.id === data.walletId);
        if (wallet && data.amount > wallet.balance) {
            transactionForm.setError("amount", {
                type: "manual",
                message: "Expense amount cannot exceed wallet balance.",
            });
            return;
        }
    }

    const [hours, minutes, seconds] = data.time.split(':').map(Number);
    let combinedDate = setHours(data.date, hours);
    combinedDate = setMinutes(combinedDate, minutes);
    combinedDate = setSeconds(combinedDate, seconds || 0);
    
    const transactionData: Transaction = {
        ...data,
        id: transaction?.id || uuidv4(),
        date: combinedDate.toISOString(),
        notes: data.notes || '',
        tags: data.tags || [],
        attachments: data.attachments || [],
        debtId: transaction?.debtId, // Preserve debtId on update
    };

    if (transaction) {
      updateTransaction(transaction, transactionData);
      toast({ title: t('toastTransactionUpdated') });
    } else {
      addTransaction(transactionData);
      toast({ title: t('toastTransactionAdded') });
    }
    setIsOpen(false);
  };

  const onTransferSubmit = async (data: TransferFormValues) => {
    const isEditing = !!(transaction && transaction.transferId);
    
    if (isEditing) {
        // Handle editing notes/tags for an existing transfer
        const otherSide = transactions.find(t => t.id === transaction.transferId);
        if (otherSide) {
             const updatedSelf: Transaction = {
                ...transaction,
                notes: data.notes || `Transfer to ${wallets.find(w => w.id === data.toWalletId)?.name}`,
                tags: data.tags || []
            };
            const updatedOther: Transaction = {
                ...otherSide,
                notes: data.notes || `Transfer from ${wallets.find(w => w.id === data.fromWalletId)?.name}`,
                tags: data.tags || []
            };
            // This logic is simplified; a real implementation would need to be more robust.
            await updateTransaction(transaction, updatedSelf);
            await updateTransaction(otherSide, updatedOther);
        }
        toast({ title: t('toastTransactionUpdated') });
    } else {
        // Handle creating a new transfer
        const fromWallet = wallets.find(w => w.id === data.fromWalletId);
        if (fromWallet && fromWallet.balance < data.amount) {
            transferForm.setError("amount", {
                type: "manual",
                message: "Insufficient balance in the source wallet.",
            });
            return;
        }

        const [hours, minutes, seconds] = data.time.split(':').map(Number);
        let combinedDate = setHours(data.date, hours);
        combinedDate = setMinutes(combinedDate, minutes);
        combinedDate = setSeconds(combinedDate, seconds || 0);

        await addTransfer({
            fromWalletId: data.fromWalletId,
            toWalletId: data.toWalletId,
            amount: data.amount,
            date: combinedDate.toISOString(),
            notes: data.notes || "",
            tags: data.tags || [],
        });
        toast({ title: t('toastTransferSuccess'), description: t('toastTransferSuccessDesc') });
    }
    setIsOpen(false);
  }
  
  const filteredCategories = useMemo(() => {
    const type = transactionForm.watch("type");
    let results = categories.filter(c => 
      (c.type === type || c.type === 'all') && 
      !['sys-initial', 'sys-adjustment', 'sys-transfer'].includes(c.id)
    );
  
    if (isEditing && transaction?.categoryId) {
      const selectedIsIncluded = results.some(c => 
        c.id === transaction.categoryId || c.subcategories.some(sc => sc.id === transaction.categoryId)
      );
      if (!selectedIsIncluded) {
        const selectedMainCategory = categories.find(c => 
          c.id === transaction.categoryId || c.subcategories.some(sc => sc.id === transaction.categoryId)
        );
        if (selectedMainCategory) {
          results.push(selectedMainCategory);
        }
      }
    }
    
    return results;
  }, [transactionForm.watch("type"), categories, isEditing, transaction]);


  const tagOptions = tags.map(tag => ({ value: tag.name, label: tag.name }));

  const handleCreateTag = (tagName: string) => {
    const newTag = { id: uuidv4(), name: tagName };
    dispatch({ type: "ADD_TAG", payload: newTag });
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
                title: t('toastFileTooLarge'),
                description: t('toastFileTooLargeDesc', { fileName: file.name })
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
            const currentAttachments = transactionForm.getValues("attachments") || [];
            transactionForm.setValue("attachments", [...currentAttachments, newAttachment]);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleRemoveAttachment = (id: string) => {
      const currentAttachments = transactionForm.getValues("attachments") || [];
      transactionForm.setValue("attachments", currentAttachments.filter(att => att.id !== id));
  }

  const renderTransactionForm = () => (
    <Form {...transactionForm}>
      <form key={activeTab} onSubmit={transactionForm.handleSubmit(onTransactionSubmit)} className="space-y-4 px-4">
        {lockedReason && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('lockedTransaction')}</AlertTitle>
                <AlertDescription>
                    {t(lockedReason === 'debt' ? 'lockedTransactionDesc_debt' : 
                       lockedReason === 'transfer' ? 'lockedTransactionDesc_transfer' :
                       'lockedTransactionDesc_system'
                    )}
                </AlertDescription>
            </Alert>
        )}
        <fieldset disabled={!!isLocked} className="space-y-4">
            <FormField
            control={transactionForm.control}
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
            
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={transactionForm.control}
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
                <FormField
                control={transactionForm.control}
                name="categoryId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('category')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={transactionForm.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                    <FormLabel>{t('date')}</FormLabel>
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
                    control={transactionForm.control}
                    name="time"
                    render={({ field }) => (
                        <FormItem className="flex flex-col pt-2">
                            <FormLabel>{t('time')}</FormLabel>
                            <FormControl>
                                <Input type="time" step="1" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </fieldset>
        
        <FormField
          control={transactionForm.control}
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
          control={transactionForm.control}
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
            control={transactionForm.control}
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

      </form>
    </Form>
  );

  const renderTransferForm = () => {
    if (wallets.length < 2 && !isEditingTransfer) {
      return (
        <div className="px-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('transferUnavailable')}</AlertTitle>
            <AlertDescription>
              <p className="mb-4">{t('transferUnavailableDescription')}</p>
              <Button onClick={() => setIsWalletFormOpen(true)}>{t('createWallet')}</Button>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return (
    <Form {...transferForm}>
      <form key={activeTab} onSubmit={transferForm.handleSubmit(onTransferSubmit)} className="space-y-4 px-4">
            <fieldset disabled={isEditingTransfer} className="space-y-4">
                <FormField
                    control={transferForm.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('amount')}</FormLabel>
                        <FormControl>
                            <Input 
                                type="text"
                                readOnly={isEditingTransfer}
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

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={transferForm.control}
                        name="fromWalletId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('fromWallet')}</FormLabel>
                            <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                            disabled={isEditingTransfer}
                            >
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
                    )}/>
                    <FormField
                        control={transferForm.control}
                        name="toWalletId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('toWallet')}</FormLabel>
                            <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                            disabled={isEditingTransfer}
                            >
                                <FormControl><SelectTrigger><SelectValue placeholder={t('select')} /></SelectTrigger></FormControl>
                                <SelectContent>
                                {wallets
                                .filter(w => w.id !== transferForm.watch("fromWalletId"))
                                .map(w => {
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
                    )}/>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={transferForm.control}
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
                        control={transferForm.control}
                        name="time"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>{t('time')}</FormLabel>
                                <FormControl>
                                    <Input type="time" step="1" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </fieldset>

            <FormField
                control={transferForm.control}
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
            control={transferForm.control}
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
    )
  };

  const formContent = (
    <div className="px-4">
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (lockedReason) return;
          const newTab = value as "income" | "expense" | "transfer";
          setActiveTab(newTab);
        }}
        className="w-full"
      >
        <TabsList className={cn("grid w-full grid-cols-3", (isEditing && !isEditingTransfer || !!lockedReason) && "hidden")}>
          <TabsTrigger value="expense" hidden={isEditingTransfer}>{t('expense')}</TabsTrigger>
          <TabsTrigger value="income" hidden={isEditingTransfer}>{t('income')}</TabsTrigger>
          <TabsTrigger value="transfer" hidden={isEditing && !isEditingTransfer}>{t('transfer')}</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="pt-4">
        {activeTab === 'transfer' ? renderTransferForm() : renderTransactionForm()}
      </div>
    </div>
  );

  const handleSubmit = () => {
    if(activeTab === 'transfer') {
        if (wallets.length >= 2 || isEditingTransfer) {
          transferForm.handleSubmit(onTransferSubmit)();
        }
    } else {
        transactionForm.handleSubmit(onTransactionSubmit)();
    }
  }

  const showSaveButton = !(activeTab === 'transfer' && wallets.length < 2 && !isEditingTransfer);

  const mainForm = (
    <>
      <ScrollArea className="overflow-y-auto max-h-[70vh]">
          {formContent}
      </ScrollArea>
      <WalletForm isOpen={isWalletFormOpen} setIsOpen={setIsWalletFormOpen} />
    </>
  );

  const mobileFooter = (
    <DrawerFooter className="pt-2 flex-col-reverse gap-2">
        {isEditing && (
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
                        {t('deleteTransactionWarning')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSubmit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {t('delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
        {showSaveButton && <Button onClick={handleSubmit} className="w-full">{t('saveTransaction')}</Button>}
    </DrawerFooter>
  );

  if (isMobile) {
    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerContent>
                <DrawerHeader className="text-left">
                    <DrawerTitle>{transaction ? t('editTransaction') : t('addTransaction')}</DrawerTitle>
                    <DrawerDescription>
                        {transaction ? t('updateTransactionDetails') : t('recordNewIncomeOrExpense')}
                    </DrawerDescription>
                </DrawerHeader>
                {mainForm}
                {mobileFooter}
            </DrawerContent>
        </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{transaction ? t('editTransaction') : t('addTransaction')}</DialogTitle>
          <DialogDescription>
            {transaction ? t('updateTransactionDetails') : t('recordNewIncomeOrExpense')}
          </DialogDescription>
        </DialogHeader>
        {mainForm}
        <div className="px-4 pb-4">
            {showSaveButton && <Button type="submit" onClick={handleSubmit} className="w-full">{t('saveTransaction')}</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
