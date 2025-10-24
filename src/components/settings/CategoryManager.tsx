

"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import { MoreHorizontal, Edit, Trash2, PlusCircle, ArrowUp, ArrowDown, ChevronRight, CornerDownRight, ArrowRightLeft, HelpCircle, Info, MoreVertical, Shield, RotateCcw } from "lucide-react"
import * as LucideIcons from "lucide-react"
import Link from "next/link"

import { useAppContext } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
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
import type { Category, SubCategory } from "@/lib/types"
import { toast } from "@/hooks/use-toast-internal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useTranslation } from "@/hooks/use-translation"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useIsMobile } from "@/hooks/use-mobile"
import { ScrollArea } from "../ui/scroll-area"
import { Badge } from "../ui/badge"

const subCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  icon: z.string().min(1, "Icon is required."),
  color: z.string().optional(),
})

type SubCategoryFormValues = z.infer<typeof subCategorySchema>;

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  icon: z.string().min(1, "Icon is required."),
  type: z.enum(['income', 'expense', 'all']),
  parentId: z.string().optional(),
  color: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const getRandomHexColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const SubCategoryForm = ({ subCategory, parentCategory, setIsOpen }: { subCategory: SubCategory, parentCategory: Category, setIsOpen: (val: boolean) => void }) => {
    const { dispatch } = useAppContext();
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const form = useForm<SubCategoryFormValues>({
        resolver: zodResolver(subCategorySchema),
        defaultValues: {
            ...subCategory,
            color: subCategory.color || getRandomHexColor()
        },
    });

    const onSubmit = (data: SubCategoryFormValues) => {
        dispatch({ type: "UPDATE_SUBCATEGORY", payload: { parentCategoryId: parentCategory.id, subCategory: { ...subCategory, ...data } } });
        toast({ title: t('toastSubcategoryUpdated') });
        setIsOpen(false);
    };

    const handleReset = () => {
      if (subCategory.isSystem && subCategory.defaultName && subCategory.defaultIcon) {
        form.setValue('name', subCategory.defaultName);
        form.setValue('icon', subCategory.defaultIcon);
        toast({ title: t('toastSubcategoryReset'), description: t('toastSubcategoryResetDesc', { subcategoryName: subCategory.name }) });
      }
    };
    
    const isModified = subCategory.isSystem && (form.watch('name') !== subCategory.defaultName || form.watch('icon') !== subCategory.defaultIcon);

    const formContent = (
      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
              <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel>{t('subcategoryName')}</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )}
              />
              <div className="flex items-center gap-4">
                  <FormField
                      control={form.control}
                      name="icon"
                      render={({ field }) => (
                          <FormItem className="flex-1">
                              <FormLabel>{t('iconNameLucide')}</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
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
              </div>
          </form>
      </Form>
    );

    const footerContent = (
      <div className="flex gap-2 w-full">
        {isModified && (
          <Button variant="outline" onClick={handleReset}><RotateCcw className="mr-2 h-4 w-4" /> {t('reset')}</Button>
        )}
        <Button onClick={form.handleSubmit(onSubmit)} className="w-full flex-1">{t('save')}</Button>
      </div>
    );

    if (isMobile) {
      return (
        <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t('editSubcategory')}</DrawerTitle>
            </DrawerHeader>
            <ScrollArea className="overflow-y-auto max-h-[70vh]">
              {formContent}
            </ScrollArea>
            <DrawerFooter>
              {footerContent}
            </DrawerFooter>
        </DrawerContent>
      )
    }

    return (
        <DialogContent>
            <DialogHeader><DialogTitle>{t('editSubcategory')}</DialogTitle></DialogHeader>
            {formContent}
            <DialogFooter className="pt-4">
                {footerContent}
            </DialogFooter>
        </DialogContent>
    );
};


const CategoryForm = ({ category, setIsOpen }: { category?: Category, setIsOpen: (val: boolean) => void }) => {
    const { state, dispatch } = useAppContext();
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const isSystemCategory = !!category?.isSystem;

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: category ? { ...category, parentId: undefined, color: category.color || getRandomHexColor() } : { name: "", icon: "Package", type: "expense", parentId: undefined, color: getRandomHexColor() },
    });

    const parentId = form.watch("parentId");

    const onSubmit = (data: CategoryFormValues) => {
        if (category) {
            dispatch({ type: "UPDATE_CATEGORY", payload: { ...category, ...data, type: isSystemCategory ? category.type : data.type } });
            toast({ title: t('toastCategoryUpdated') });
        } else {
            if (data.parentId) {
                const subCategory: SubCategory = { id: uuidv4(), name: data.name, icon: data.icon, color: data.color };
                dispatch({ type: "ADD_SUBCATEGORY", payload: { parentCategoryId: data.parentId, subCategory } });
                toast({ title: t('toastSubcategoryAdded') });
            } else {
                dispatch({ type: "ADD_CATEGORY", payload: { ...data, id: uuidv4(), subcategories: [] } });
                toast({ title: t('toastCategoryAdded') });
            }
        }
        setIsOpen(false);
    };

    const handleReset = () => {
      if (category?.isSystem && category.defaultName && category.defaultIcon) {
        form.setValue('name', category.defaultName);
        form.setValue('icon', category.defaultIcon);
        toast({ title: t('toastCategoryReset'), description: t('toastCategoryResetDesc', { categoryName: category.name }) });
      }
    };
    
    const isModified = category?.isSystem && (form.watch('name') !== category.defaultName || form.watch('icon') !== category.defaultIcon);
    const mainCategories = state.categories;

    const formContent = (
      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
              {!category && (
                   <FormField
                      control={form.control}
                      name="parentId"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>{t('parentCategoryOptional')}</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : value)} value={field.value ?? "none"}>
                              <FormControl><SelectTrigger><SelectValue placeholder={t('selectParentToCreateSubcategory')} /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="none">-- {t('createMainCategory')} --</SelectItem>
                                {mainCategories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                              </SelectContent>
                          </Select>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
              )}
              <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>{t('name')}</FormLabel>
                      <FormControl><Input placeholder={form.getValues("parentId") ? t('egGroceries') : t('egFoodDrink')} {...field} /></FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
              />
               <div className="flex items-center gap-4">
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
                              <FormControl><Input placeholder={form.getValues("parentId") ? t('egShoppingCart') : t('egCupSoda')} {...field} /></FormControl>
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
              </div>
              {!parentId && (
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('transactionType')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSystemCategory}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                            <SelectItem value="expense">{t('expense')}</SelectItem>
                            <SelectItem value="income">{t('income')}</SelectItem>
                            <SelectItem value="all">{t('all')}</SelectItem>
                            </SelectContent>
                        </Select>
                        {isSystemCategory && <p className="text-xs text-muted-foreground mt-2">{t('systemCategoryTypeCannotBeChanged')}</p>}
                        <FormMessage />
                        </FormItem>
                    )}
                />
              )}
          </form>
      </Form>
    );

    const title = category ? t('editCategory') : t('addNewCategoryOrSubcategory');

    const footerContent = (
      <div className="flex gap-2 w-full">
        {isModified && (
          <Button variant="outline" onClick={handleReset}><RotateCcw className="mr-2 h-4 w-4" /> {t('reset')}</Button>
        )}
        <Button onClick={form.handleSubmit(onSubmit)} className="w-full flex-1">{t('save')}</Button>
      </div>
    );

    if (isMobile) {
      return (
        <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
            </DrawerHeader>
            <ScrollArea className="overflow-y-auto max-h-[70vh]">
              {formContent}
            </ScrollArea>
            <DrawerFooter>
              {footerContent}
            </DrawerFooter>
        </DrawerContent>
      );
    }
    
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            {formContent}
            <DialogFooter className="pt-4">
                {footerContent}
            </DialogFooter>
        </DialogContent>
    );
}

export function CategoryManager() {
    const { state } = useAppContext();
    const { t } = useTranslation();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const isMobile = useIsMobile();

    const handleDeleteCategory = (id: string) => {
        dispatch({ type: "DELETE_CATEGORY", payload: id });
        toast({ title: t('toastCategoryDeleted'), variant: "destructive" });
    }

    const handleDeleteSubCategory = (parentCategoryId: string, subCategoryId: string) => {
        dispatch({ type: "DELETE_SUBCATEGORY", payload: { parentCategoryId, subCategoryId } });
        toast({ title: t('toastSubcategoryDeleted'), variant: "destructive" });
    };
    
    const { dispatch } = useAppContext();


    const addCategoryButton = (
        <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> {t('addNew')}
        </Button>
    );
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>{t('categories')}</CardTitle>
            <CardDescription>
                {t('manageCategoriesDescription')}
            </CardDescription>
        </div>
        
        {isMobile ? (
            <Drawer open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DrawerTrigger asChild>
                    {addCategoryButton}
                </DrawerTrigger>
                {isFormOpen && <CategoryForm setIsOpen={setIsFormOpen} />}
            </Drawer>
        ) : (
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    {addCategoryButton}
                </DialogTrigger>
                {isFormOpen && <CategoryForm setIsOpen={setIsFormOpen} />}
            </Dialog>
        )}

      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
            {state.categories.map((category) => (
                <CategoryRow key={category.id} category={category} onDelete={handleDeleteCategory} onDeleteSubCategory={handleDeleteSubCategory} />
            ))}
        </div>
      </CardContent>
    </Card>
  );
}


const CategoryRow = ({ category, onDelete, onDeleteSubCategory }: { category: Category, onDelete: (id: string) => void, onDeleteSubCategory: (parentCategoryId: string, subCategoryId: string) => void}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const Icon = (LucideIcons[category.icon as keyof typeof LucideIcons] as React.ElementType) || HelpCircle;
    
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

    const deleteTrigger = (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          {isMobile ? (
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={category.isSystem}>
              <Trash2 className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">{t('delete')}</span>
            </DropdownMenuItem>
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" disabled={category.isSystem}>
                <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('deleteCategoryConfirmation', { categoryName: category.name })}</AlertDialogTitle>
                <AlertDialogDescription>{t('deleteCategoryWarning')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(category.id)}>{t('delete')}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
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
                 <DropdownMenuSeparator />
                 {deleteTrigger}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const desktopActions = (
        <div className="flex items-center gap-1">
            {editTrigger}
            {deleteTrigger}
        </div>
    );

    return (
        <Collapsible className="border-b last:border-b-0">
            <div className="flex items-center p-2">
                <CollapsibleTrigger asChild>
                    <div className="flex items-center gap-2 flex-1 cursor-pointer p-2 overflow-hidden">
                        <ChevronRight className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-90" />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                        <Icon size={16} /> 
                        <span className="font-medium truncate">{category.name}</span>
                        {category.isSystem && (
                            <TooltipProvider>
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge variant="outline" className="flex items-center gap-1.5 ml-2 cursor-help p-1 h-fit">
                                        <Shield size={12} />
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{category.defaultName}</p>
                                </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </CollapsibleTrigger>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto whitespace-nowrap p-2">
                    {category.type === 'income' && <ArrowUp size={14} className="text-green-500" />}
                    {category.type === 'expense' && <ArrowDown size={14} className="text-red-500" />}
                    {category.type === 'all' && <ArrowRightLeft size={14} className="text-blue-500" />}
                    <span className="capitalize hidden sm:inline">{t(category.type)}</span>
                </div>

                <div className="p-2">
                    {isMobile ? mobileActions : desktopActions}
                </div>
            </div>
            <CollapsibleContent>
                <div className="pl-12 pr-4 pb-2">
                    {category.subcategories.length > 0 ? (
                        category.subcategories.map(sub => (
                            <SubCategoryRow key={sub.id} subCategory={sub} parentCategory={category} onDelete={onDeleteSubCategory} />
                        ))
                    ) : (
                        <p className="text-xs text-muted-foreground text-center py-2">{t('noSubcategories')}</p>
                    )}
                </div>
            </CollapsibleContent>
            {isMobile ? (
                <Drawer open={isFormOpen} onOpenChange={setIsFormOpen}>
                    {isFormOpen && <CategoryForm category={category} setIsOpen={setIsFormOpen} />}
                </Drawer>
            ) : (
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    {isFormOpen && <CategoryForm category={category} setIsOpen={setIsFormOpen} />}
                </Dialog>
            )}
        </Collapsible>
    )
}

const SubCategoryRow = ({ subCategory, parentCategory, onDelete }: { subCategory: SubCategory, parentCategory: Category, onDelete: (parentCategoryId: string, subCategoryId: string) => void}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const Icon = (LucideIcons[subCategory.icon as keyof typeof LucideIcons] as React.ElementType) || HelpCircle;

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
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={subCategory.isSystem}>
                            <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                            <span className="text-red-500">{t('delete')}</span>
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('deleteSubcategoryConfirmation', { subcategoryName: subCategory.name })}</AlertDialogTitle>
                            <AlertDialogDescription>{t('thisWillBePermanent')}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(parentCategory.id, subCategory.id)}>{t('delete')}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
    
    const desktopActions = (
        <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {editTrigger}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" disabled={subCategory.isSystem}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('deleteSubcategoryConfirmation', { subcategoryName: subCategory.name })}</AlertDialogTitle>
                        <AlertDialogDescription>{t('thisWillBePermanent')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(parentCategory.id, subCategory.id)}>{t('delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );

    return (
        <div className="flex items-center p-2 rounded-md hover:bg-muted/50 group">
            <CornerDownRight className="h-4 w-4 mr-2 text-muted-foreground" />
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: subCategory.color }} />
            <Icon size={16} className="mr-2 text-muted-foreground" />
            <span className="truncate">{subCategory.name}</span>
            
            {subCategory.isSystem && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant="outline" className="flex items-center gap-1.5 ml-2 cursor-help p-1 h-fit">
                                <Shield size={12} />
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{subCategory.defaultName}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}

            <div className="ml-auto">
                {isMobile ? mobileActions : desktopActions}
            </div>
            {isMobile ? (
                <Drawer open={isFormOpen} onOpenChange={setIsFormOpen}>
                    {isFormOpen && <SubCategoryForm subCategory={subCategory} parentCategory={parentCategory} setIsOpen={setIsFormOpen} />}
                </Drawer>
            ) : (
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    {isFormOpen && <SubCategoryForm subCategory={subCategory} parentCategory={parentCategory} setIsOpen={setIsFormOpen} />}
                </Dialog>
            )}
        </div>
    );
};



