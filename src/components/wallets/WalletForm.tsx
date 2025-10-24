

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { Trash2, HelpCircle } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Wallet, Transaction } from "@/lib/types";
import { useWallet } from "@/context/WalletContext";
import { useTranslation } from "@/hooks/use-translation";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "../ui/scroll-area";

const walletSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  balance: z.coerce.number().min(0, "Balance cannot be negative."),
  typeId: z.string({ required_error: "Please select a wallet type." }),
  color: z.string().optional(),
});

type WalletFormValues = z.infer<typeof walletSchema>;

type WalletFormProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  wallet?: Wallet;
  onSuccess?: () => void;
};

const getRandomHexColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export function WalletForm({ isOpen, setIsOpen, wallet, onSuccess }: WalletFormProps) {
  const { walletTypes, addWallet, updateWallet, deleteWallet } = useWallet();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      name: "",
      balance: 0,
      typeId: undefined,
      color: getRandomHexColor(),
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (wallet) {
        form.reset({
          name: wallet.name,
          balance: wallet.balance,
          typeId: wallet.typeId,
          color: wallet.color || getRandomHexColor()
        });
      } else {
        form.reset({
          name: "",
          balance: 0,
          typeId: undefined,
          color: getRandomHexColor()
        });
      }
    }
  }, [wallet, isOpen, form]);

  const onSubmit = (data: WalletFormValues) => {
    if (wallet) {
      updateWallet(wallet, data);
    } else {
      const { balance, ...walletData } = data;
      addWallet(walletData, balance);
    }
    
    if (onSuccess) {
      onSuccess();
    } else {
      setIsOpen(false);
    }
  };
  
  const handleDelete = () => {
    if (!wallet) return;
    deleteWallet(wallet.id);
    setIsOpen(false);
  }

  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    field.onChange(numericValue === '' ? '' : Number(numericValue));
  };

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('walletName')}</FormLabel>
              <FormControl>
                <Input placeholder={t('egSavingsAccount')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{wallet ? t('currentBalance') : t('initialBalance')}</FormLabel>
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
        <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
            <FormField
            control={form.control}
            name="typeId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('walletType')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={t('selectAType')} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {walletTypes.map((type) => {
                        const Icon = (LucideIcons[type.icon as keyof typeof LucideIcons] as React.ElementType) || HelpCircle;
                        return (
                        <SelectItem key={type.id} value={type.id} className="capitalize">
                            <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span>{type.name}</span>
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
                name="color"
                render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <Input type="color" {...field} className="p-1 h-10 w-14"/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
      </form>
    </Form>
  );

  const deleteButton = wallet && (
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
            {t('deleteWalletWarning')}
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
            <DrawerTitle>{wallet ? t('editWallet') : t('addWallet')}</DrawerTitle>
            <DrawerDescription>
                {wallet ? t('updateWalletDetails') : t('createWalletToTrackFinances')}
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
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{wallet ? t('editWallet') : t('addWallet')}</DialogTitle>
          <DialogDescription>
            {wallet ? t('updateWalletDetails') : t('createWalletToTrackFinances')}
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
            {formContent}
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            {wallet && <div className="flex-1">{deleteButton}</div>}
            <Button type="submit" onClick={form.handleSubmit(onSubmit)} className="w-full">{t('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
