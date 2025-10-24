

"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import { MoreVertical, Edit, Trash2, PlusCircle, HelpCircle, Info } from "lucide-react"
import * as LucideIcons from "lucide-react"
import Link from "next/link"

import { useWallet } from "@/context/WalletContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger
} from "@/components/ui/drawer"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { WalletType } from "@/lib/types"
import { useTranslation } from "@/hooks/use-translation"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useIsMobile } from "@/hooks/use-mobile"
import { ScrollArea } from "../ui/scroll-area"

const walletTypeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  icon: z.string().min(1, "Icon is required."),
});

type WalletTypeFormValues = z.infer<typeof walletTypeSchema>;

const WalletTypeForm = ({ walletType, setIsOpen }: { walletType?: WalletType, setIsOpen: (val: boolean) => void }) => {
    const { addWalletType, updateWalletType } = useWallet();
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const form = useForm<WalletTypeFormValues>({
        resolver: zodResolver(walletTypeSchema),
        defaultValues: walletType || { name: "", icon: "Landmark" },
    });

    const onSubmit = (data: WalletTypeFormValues) => {
        if (walletType) {
            updateWalletType({ ...walletType, ...data });
        } else {
            addWalletType(data);
        }
        setIsOpen(false);
        form.reset();
    };

    const formContent = (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('name')}</FormLabel>
                        <FormControl><Input placeholder={t('egBank')} {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                            <div className="flex items-center gap-2">
                                <FormLabel>{t('iconNameLucide')}</FormLabel>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer">
                                                <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('lucideTooltip')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        <FormControl><Input placeholder={"Landmark"} {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    );

    const title = walletType ? t('editWalletType') : t('addNewWalletType');
    const description = walletType ? undefined : t('manageWalletTypes');

    if (isMobile) {
        return (
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>{title}</DrawerTitle>
                    {description && <DrawerDescription>{description}</DrawerDescription>}
                </DrawerHeader>
                <ScrollArea className="overflow-y-auto max-h-[70vh]">
                    {formContent}
                </ScrollArea>
                <DrawerFooter>
                    <Button onClick={form.handleSubmit(onSubmit)} className="w-full">{t('save')}</Button>
                </DrawerFooter>
            </DrawerContent>
        )
    }

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                 {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
            {formContent}
             <DialogFooter>
                <Button type="submit" onClick={form.handleSubmit(onSubmit)} className="w-full">{t('save')}</Button>
            </DialogFooter>
        </DialogContent>
    )
}

export function WalletTypeManager() {
    const { walletTypes, deleteWalletType } = useWallet();
    const { t } = useTranslation();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const isMobile = useIsMobile();

    const handleDelete = (id: string) => {
        deleteWalletType(id);
    }

    const addWalletTypeButton = (
        <Button onClick={() => setIsFormOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> {t('addNew')}</Button>
    );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>{t('walletTypes')}</CardTitle>
            <CardDescription>
                {t('manageWalletTypes')}
            </CardDescription>
        </div>
        {isMobile ? (
            <Drawer open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DrawerTrigger asChild>
                    {addWalletTypeButton}
                </DrawerTrigger>
                {isFormOpen && <WalletTypeForm setIsOpen={setIsFormOpen} />}
            </Drawer>
        ) : (
             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    {addWalletTypeButton}
                </DialogTrigger>
                {isFormOpen && <WalletTypeForm setIsOpen={setIsFormOpen} />}
            </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t('iconNameLucide')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {walletTypes.map((wt) => (
                    <WalletTypeRow key={wt.id} walletType={wt} onDelete={handleDelete} />
                ))}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}


const WalletTypeRow = ({ walletType, onDelete }: { walletType: WalletType, onDelete: (id: string) => void}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const Icon = (LucideIcons[walletType.icon as keyof typeof LucideIcons] as React.ElementType) || HelpCircle;
    
    const editTrigger = isMobile ? (
        <DropdownMenuItem onClick={() => setIsFormOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>{t('edit')}</span>
        </DropdownMenuItem>
    ) : (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsFormOpen(true)}>
            <Edit className="h-4 w-4" />
        </Button>
    );

    const mobileActions = (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                 {editTrigger}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                            <span className="text-red-500">{t('delete')}</span>
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('deleteWalletTypeConfirmation', { walletTypeName: walletType.name })}</AlertDialogTitle>
                            <AlertDialogDescription>{t('thisWillBePermanent')}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(walletType.id)}>{t('delete')}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const desktopActions = (
        <div className="flex items-center justify-end gap-2">
            {editTrigger}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('deleteWalletTypeConfirmation', { walletTypeName: walletType.name })}</AlertDialogTitle>
                        <AlertDialogDescription>{t('thisWillBePermanent')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(walletType.id)}>{t('delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );

    return (
        <>
            <TableRow>
                <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                        <Icon size={16} /> 
                        <span>{walletType.name}</span>
                    </div>
                </TableCell>
                <TableCell className="font-mono text-xs hidden sm:table-cell">{walletType.icon}</TableCell>
                <TableCell className="text-right">
                {isMobile ? mobileActions : desktopActions}
                </TableCell>
            </TableRow>
            {isMobile ? (
                <Drawer open={isFormOpen} onOpenChange={setIsFormOpen}>
                    {isFormOpen && <WalletTypeForm walletType={walletType} setIsOpen={setIsFormOpen} />}
                </Drawer>
            ) : (
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    {isFormOpen && <WalletTypeForm walletType={walletType} setIsOpen={setIsFormOpen} />}
                </Dialog>
            )}
        </>
    )
}
