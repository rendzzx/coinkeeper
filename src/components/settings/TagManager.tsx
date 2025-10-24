

"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import { MoreVertical, Edit, Trash2, PlusCircle, Tag as TagIcon } from "lucide-react"

import { useAppContext } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { Tag } from "@/lib/types"
import { toast } from "@/hooks/use-toast-internal"
import { useTranslation } from "@/hooks/use-translation"
import { useIsMobile } from "@/hooks/use-mobile"
import { ScrollArea } from "../ui/scroll-area"

const tagSchema = z.object({
  name: z.string().min(2, "Tag name must be at least 2 characters."),
  color: z.string().optional(),
});

type TagFormValues = z.infer<typeof tagSchema>;

const getRandomHexColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const TagForm = ({ tag, setIsOpen }: { tag?: Tag, setIsOpen: (val: boolean) => void }) => {
    const { dispatch } = useAppContext();
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const form = useForm<TagFormValues>({
        resolver: zodResolver(tagSchema),
        defaultValues: tag ? { ...tag, color: tag.color || getRandomHexColor() } : { name: "", color: getRandomHexColor() },
    });

    const onSubmit = (data: TagFormValues) => {
        if (tag) {
            dispatch({ type: "UPDATE_TAG", payload: { ...tag, ...data } });
            toast({ title: t('toastTagUpdated') });
        } else {
            dispatch({ type: "ADD_TAG", payload: { ...data, id: uuidv4() } });
            toast({ title: t('toastTagAdded') });
        }
        setIsOpen(false);
    };

    const formContent = (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('tagName')}</FormLabel>
                        <FormControl><Input placeholder={t('egTravel')} {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Color</FormLabel>
                            <FormControl>
                                <Input type="color" {...field} className="p-1 h-10 w-14"/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    );

    const title = tag ? t('editTag') : t('addNewTag');
    const description = tag ? undefined : t('manageTagsDescription');

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
        );
    }
    
    return (
         <DialogContent>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
            {formContent}
             <DialogFooter className="pt-4">
                <Button type="submit" onClick={form.handleSubmit(onSubmit)} className="w-full">{t('save')}</Button>
            </DialogFooter>
        </DialogContent>
    );
}

export function TagManager() {
    const { state, dispatch } = useAppContext();
    const { t } = useTranslation();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const isMobile = useIsMobile();

    const handleDelete = (id: string) => {
        dispatch({ type: "DELETE_TAG", payload: id });
    }

    const addTagButton = (
        <Button onClick={() => setIsFormOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> {t('addTag')}</Button>
    );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>{t('tags')}</CardTitle>
            <CardDescription>
                {t('manageTagsDescription')}
            </CardDescription>
        </div>
        {isMobile ? (
            <Drawer open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DrawerTrigger asChild>
                    {addTagButton}
                </DrawerTrigger>
                {isFormOpen && <TagForm setIsOpen={setIsFormOpen} />}
            </Drawer>
        ) : (
             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    {addTagButton}
                </DialogTrigger>
                {isFormOpen && <TagForm setIsOpen={setIsFormOpen} />}
            </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {state.tags.map((tag) => (
                    <TagRow key={tag.id} tag={tag} onDelete={handleDelete} />
                ))}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}


const TagRow = ({ tag, onDelete }: { tag: Tag, onDelete: (id: string) => void}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { t } = useTranslation();
    const isMobile = useIsMobile();

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
                            <AlertDialogTitle>{t('deleteTagConfirmation', { tagName: tag.name })}</AlertDialogTitle>
                            <AlertDialogDescription>{t('thisWillBePermanent')}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(tag.id)}>{t('delete')}</AlertDialogAction>
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
                        <AlertDialogTitle>{t('deleteTagConfirmation', { tagName: tag.name })}</AlertDialogTitle>
                        <AlertDialogDescription>{t('thisWillBePermanent')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(tag.id)}>{t('delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );

    return (
        <>
            <TableRow>
                <TableCell className="font-medium flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }} />
                    <TagIcon size={16} /> {tag.name}
                </TableCell>
                <TableCell className="text-right">
                    {isMobile ? mobileActions : desktopActions}
                </TableCell>
            </TableRow>
            {isMobile ? (
                <Drawer open={isFormOpen} onOpenChange={setIsFormOpen}>
                    {isFormOpen && <TagForm tag={tag} setIsOpen={setIsFormOpen} />}
                </Drawer>
            ) : (
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    {isFormOpen && <TagForm tag={tag} setIsOpen={setIsFormOpen} />}
                </Dialog>
            )}
        </>
    )
}
