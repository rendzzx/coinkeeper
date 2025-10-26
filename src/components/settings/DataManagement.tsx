"use client";

import {useState, useRef, useEffect, RefObject} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {
  Upload,
  Download,
  KeyRound,
  Loader2,
  ShieldOff,
  Shield,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import {useAppContext} from "@/context/AppContext";
import {useSettings} from "@/context/SettingsContext";
import {Button} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import {Input} from "@/components/ui/input";
import {encryptData, decryptData} from "@/lib/encryption";
import {toast} from "@/hooks/use-toast-internal";
import type {AppState} from "@/lib/types";
import {useTranslation} from "@/hooks/use-translation";
import {Switch} from "../ui/switch";
import {Label} from "../ui/label";
import {cn} from "@/lib/utils";
import {db} from "@/lib/db";

const passwordSchema = (useEncryption: boolean) =>
  z.object({
    password: useEncryption
      ? z.string().min(8, "Password must be at least 8 characters.")
      : z.string().optional(),
  });
type PasswordFormValues = z.infer<ReturnType<typeof passwordSchema>>;

const importPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
});
type ImportPasswordFormValues = z.infer<typeof importPasswordSchema>;

interface DataManagementProps {
  isExportOpen?: boolean;
  setIsExportOpen?: (open: boolean) => void;
  importTriggerRef?: RefObject<HTMLInputElement>;
  isTriggered?: boolean;
}

export function DataManagement({
  isExportOpen: isExportOpenProp = false,
  setIsExportOpen: setIsExportOpenProp,
  importTriggerRef,
  isTriggered = false,
}: DataManagementProps) {
  const {state, dispatch} = useAppContext();
  const {settings} = useSettings();
  const {t} = useTranslation();
  const [isExportOpenState, setIsExportOpenState] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useEncryption, setUseEncryption] = useState(true);
  const internalFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = importTriggerRef || internalFileInputRef;

  const isExportOpen = isExportOpenProp ?? isExportOpenState;
  const setIsExportOpen = setIsExportOpenProp ?? setIsExportOpenState;

  const exportForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema(useEncryption)),
    defaultValues: {password: ""},
  });

  useEffect(() => {
    exportForm.trigger();
  }, [useEncryption, exportForm]);

  const importForm = useForm<ImportPasswordFormValues>({
    resolver: zodResolver(importPasswordSchema),
    defaultValues: {password: ""},
  });

  const handleExport = async (data: PasswordFormValues) => {
    setIsLoading(true);
    try {
      let fileContent: string;
      let fileName: string;
      let fileType: string;

      if (useEncryption) {
        fileContent = await encryptData(state, data.password!);
        fileName = "coinkeeper_backup.coinkeeper";
        fileType = "application/json";
      } else {
        fileContent = JSON.stringify(state, null, 2);
        fileName = "coinkeeper_backup.json";
        fileType = "application/json";
      }

      const blob = new Blob([fileContent], {type: fileType});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: t("toastExportSuccess"),
        description: t("toastExportSuccessDesc"),
      });
    } catch (error) {
      toast({
        title: t("toastExportFailed"),
        description: t("toastExportFailedDesc"),
        variant: "destructive",
      });
    }
    setIsLoading(false);
    setIsExportOpen(false);
    exportForm.reset();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".json") && settings.devMode) {
      handleDirectImport(file);
    } else if (file.name.endsWith(".coinkeeper")) {
      setIsImportOpen(true);
    } else {
      toast({
        title: "Unsupported File",
        description: "Please select a .coinkeeper or .json file.",
        variant: "destructive",
      });
    }
  };

  const handleDirectImport = (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const importedState = JSON.parse(jsonString) as AppState;
        if (
          importedState.wallets &&
          importedState.transactions &&
          importedState.settings
        ) {
          dispatch({type: "SET_STATE", payload: importedState});
          toast({
            title: t("toastImportSuccess"),
            description: "Unencrypted data has been restored.",
          });
        } else {
          throw new Error("Invalid data structure");
        }
      } catch (error: any) {
        toast({
          title: t("toastImportFailed"),
          description: error.message || "Could not parse JSON file.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handlePasswordImport = async ({password}: ImportPasswordFormValues) => {
    if (!fileInputRef.current?.files?.[0]) {
      toast({title: t("toastNoFileSelected"), variant: "destructive"});
      return;
    }
    setIsLoading(true);
    const file = fileInputRef.current.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const encryptedString = e.target?.result as string;
        const decryptedState = (await decryptData(
          encryptedString,
          password
        )) as AppState;
        if (
          decryptedState.wallets &&
          decryptedState.transactions &&
          decryptedState.settings
        ) {
          dispatch({type: "SET_STATE", payload: decryptedState});
          toast({
            title: t("toastImportSuccess"),
            description: t("toastImportSuccessDesc"),
          });
        } else {
          throw new Error("Invalid data structure");
        }
      } catch (error: any) {
        toast({
          title: t("toastImportFailed"),
          description: error.message || t("toastImportFailedDesc"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setIsImportOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        importForm.reset();
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    setIsLoading(true);
    try {
      // Clear all tables in IndexedDB
      await Promise.all(db.tables.map((table) => table.clear()));

      // Clear session storage to remove cached state
      sessionStorage.clear();

      toast({
        title: "Application Reset",
        description:
          "All data has been cleared. The application will now reload.",
      });

      // Wait a moment for the toast to be visible, then reload
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Failed to reset data:", error);
      toast({
        title: "Reset Failed",
        description: "Could not clear all application data.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  if (isTriggered) {
    return (
      <>
        {/* EXPORT DIALOG (from sidebar) */}
        <Dialog
          open={isExportOpen}
          onOpenChange={(isOpen) => {
            setIsExportOpen(isOpen);
            if (!isOpen) exportForm.reset();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className={cn(!useEncryption && "line-through")}>
                {t("secureExport")}
              </DialogTitle>
              <DialogDescription>
                {useEncryption
                  ? t("secureExportDescription")
                  : t("unencryptedExportDescription")}
              </DialogDescription>
            </DialogHeader>
            <Form {...exportForm}>
              <form
                onSubmit={exportForm.handleSubmit(handleExport)}
                className="space-y-4 pt-4"
              >
                {settings.devMode && (
                  <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <Label
                      htmlFor="use-encryption-sidebar"
                      className="flex items-center gap-2"
                    >
                      {useEncryption ? <Shield /> : <ShieldOff />}
                      <span>Use Encryption</span>
                    </Label>
                    <Switch
                      id="use-encryption-sidebar"
                      checked={useEncryption}
                      onCheckedChange={setUseEncryption}
                    />
                  </div>
                )}
                {useEncryption && (
                  <FormField
                    control={exportForm.control}
                    name="password"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>{t("encryptionPassword")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="password"
                              placeholder="********"
                              {...field}
                              className="pl-10"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {useEncryption ? t("encryptAndExport") : t("exportData")}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* IMPORT DIALOG & HIDDEN INPUT (from sidebar) */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".coinkeeper,.json"
          className="hidden"
        />
        <Dialog
          open={isImportOpen}
          onOpenChange={(isOpen) => {
            setIsImportOpen(isOpen);
            if (!isOpen) importForm.reset();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("secureImport")}</DialogTitle>
              <DialogDescription>
                {t("secureImportDescription")}
              </DialogDescription>
            </DialogHeader>
            <Form {...importForm}>
              <form
                onSubmit={importForm.handleSubmit(handlePasswordImport)}
                className="space-y-4 pt-4"
              >
                <FormField
                  control={importForm.control}
                  name="password"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>{t("decryptionPassword")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="********"
                            {...field}
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("decryptAndImport")}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("dataManagement")}</CardTitle>
          <CardDescription>{t("dataManagementDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {/* EXPORT */}
          <Dialog
            open={isExportOpen}
            onOpenChange={(isOpen) => {
              setIsExportOpen(isOpen);
              if (!isOpen) exportForm.reset();
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> {t("exportData")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className={cn(!useEncryption && "line-through")}>
                  {t("secureExport")}
                </DialogTitle>
                <DialogDescription>
                  {useEncryption
                    ? t("secureExportDescription")
                    : t("unencryptedExportDescription")}
                </DialogDescription>
              </DialogHeader>
              <Form {...exportForm}>
                <form
                  onSubmit={exportForm.handleSubmit(handleExport)}
                  className="space-y-4 pt-4"
                >
                  {settings.devMode && (
                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                      <Label
                        htmlFor="use-encryption"
                        className="flex items-center gap-2"
                      >
                        {useEncryption ? <Shield /> : <ShieldOff />}
                        <span>Use Encryption</span>
                      </Label>
                      <Switch
                        id="use-encryption"
                        checked={useEncryption}
                        onCheckedChange={setUseEncryption}
                      />
                    </div>
                  )}
                  {useEncryption && (
                    <FormField
                      control={exportForm.control}
                      name="password"
                      render={({field}) => (
                        <FormItem>
                          <FormLabel>{t("encryptionPassword")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="password"
                                placeholder="********"
                                {...field}
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {useEncryption ? t("encryptAndExport") : t("exportData")}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* IMPORT */}
          <Dialog
            open={isImportOpen}
            onOpenChange={(isOpen) => {
              setIsImportOpen(isOpen);
              if (!isOpen) importForm.reset();
            }}
          >
            <Button onClick={handleImportClick} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {t("importData")}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".coinkeeper,.json"
              className="hidden"
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("secureImport")}</DialogTitle>
                <DialogDescription>
                  {t("secureImportDescription")}
                </DialogDescription>
              </DialogHeader>
              <Form {...importForm}>
                <form
                  onSubmit={importForm.handleSubmit(handlePasswordImport)}
                  className="space-y-4 pt-4"
                >
                  <FormField
                    control={importForm.control}
                    name="password"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>{t("decryptionPassword")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="password"
                              placeholder="********"
                              {...field}
                              className="pl-10"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("decryptAndImport")}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle />
            Danger Zone
          </CardTitle>
          <CardDescription>
            These actions are irreversible. Please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog
            open={isResetConfirmOpen}
            onOpenChange={setIsResetConfirmOpen}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Reset All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all
                  your data, including wallets, transactions, budgets, and
                  settings. The application will be restored to its initial
                  state.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleResetData}
                  disabled={isLoading}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Yes, delete all my data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </>
  );
}
