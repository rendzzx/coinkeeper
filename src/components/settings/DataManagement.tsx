'use client';

import {useState, useRef, useEffect, RefObject} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {
  Upload,
  Download,
  KeyRound,
  Loader2,
  ShieldOff,
  Shield,
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import {useAppContext} from '@/context/AppContext';
import {useSettings} from '@/context/SettingsContext';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import {Input} from '@/components/ui/input';
import {encryptData, decryptData, verifyPassword} from '@/lib/encryption';
import {toast} from '@/hooks/use-toast-internal';
import type {AppState} from '@/lib/types';
import {useTranslation} from '@/hooks/use-translation';
import {Switch} from '../ui/switch';
import {Label} from '../ui/label';
import {cn} from '@/lib/utils';
import {db} from '@/lib/db';
import {PasswordManager} from './PasswordManager';

const createExportPasswordSchema = (
  shouldEncrypt: boolean,
  t: (key: any) => string
) =>
  z.object({
    password: z
      .string()
      .refine((val) => !shouldEncrypt || (val && val.length > 0), {
        message: t('toastPasswordRequired'),
      }),
  });

type ExportPasswordFormValues = z.infer<
  ReturnType<typeof createExportPasswordSchema>
>;

const importPasswordSchema = z.object({
  password: z.string().min(1, 'Password cannot be empty.').optional(),
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
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(
    null
  );
  const [showResetPassword, setShowResetPassword] = useState(false);
  const internalFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = importTriggerRef || internalFileInputRef;
  const [shouldEncrypt, setShouldEncrypt] = useState(true);

  const isExportOpen = isExportOpenProp ?? isExportOpenState;
  const setIsExportOpen = setIsExportOpenProp ?? setIsExportOpenState;

  const isMasterPasswordSet = !!settings.user?.passwordHash;

  const exportPasswordSchema = createExportPasswordSchema(shouldEncrypt, t);

  const exportForm = useForm<ExportPasswordFormValues>({
    resolver: zodResolver(exportPasswordSchema),
    defaultValues: {password: ''},
  });

  const importForm = useForm<ImportPasswordFormValues>({
    resolver: zodResolver(importPasswordSchema),
    defaultValues: {password: ''},
  });

  const handleExport = async (data: ExportPasswordFormValues) => {
    setIsLoading(true);
    try {
      let fileContent: string;
      let fileName: string;
      let fileType: string;

      // Always require master password for encrypted export if it's set
      if (shouldEncrypt && settings.user?.passwordHash) {
        const isVerified = await verifyPassword(
          data.password || '',
          settings.user.passwordHash
        );
        if (!isVerified) {
          exportForm.setError('password', {
            type: 'manual',
            message: t('incorrectPassword'),
          });
          setIsLoading(false);
          return;
        }
      }

      if (shouldEncrypt) {
        const password = data.password;
        if (!password) {
          toast({
            title: t('toastEncryptionError'),
            description: t('toastPasswordRequired'),
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        fileContent = await encryptData(state, password);
        fileName = 'coinkeeper_backup.coinkeeper';
        fileType = 'application/json';
      } else {
        fileContent = JSON.stringify(state, null, 2);
        fileName = 'coinkeeper_backup.json';
        fileType = 'application/json';
      }

      const blob = new Blob([fileContent], {type: fileType});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: t('toastExportSuccess'),
        description: t('toastExportSuccessDesc'),
      });
      setIsExportOpen(false);
      exportForm.reset();
    } catch (error) {
      toast({
        title: t('toastExportFailed'),
        description: t('toastExportFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportClick = () => {
    if (isMasterPasswordSet) {
      setIsExportOpen(true);
    } else {
      setIsPasswordFormOpen(true);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.coinkeeper') || file.name.endsWith('.json')) {
      setIsImportOpen(true);
    } else {
      toast({
        title: t('toastUnsupportedFile'),
        description: t('toastUnsupportedFileDesc'),
        variant: 'destructive',
      });
    }
  };

  const handlePasswordImport = async ({password}: ImportPasswordFormValues) => {
    if (!fileInputRef.current?.files?.[0]) {
      toast({title: t('toastNoFileSelected'), variant: 'destructive'});
      return;
    }
    setIsLoading(true);
    const file = fileInputRef.current.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const fileContent = e.target?.result as string;
        let decryptedState: AppState;

        if (file.name.endsWith('.json')) {
          decryptedState = JSON.parse(fileContent);
        } else {
          if (!password) {
            throw new Error(t('toastPasswordRequired'));
          }
          decryptedState = (await decryptData(
            fileContent,
            password
          )) as AppState;
        }

        if (
          decryptedState.wallets &&
          decryptedState.transactions &&
          decryptedState.settings
        ) {
          dispatch({type: 'SET_STATE', payload: decryptedState});
          toast({
            title: t('toastImportSuccess'),
            description: t('toastImportSuccessDesc'),
          });
        } else {
          throw new Error('Invalid data structure');
        }
      } catch (error: any) {
        toast({
          title: t('toastImportFailed'),
          description: error.message || t('toastImportFailedDesc'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
        setIsImportOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        importForm.reset();
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    setIsLoading(true);
    try {
      if (settings.user?.passwordHash) {
        const isVerified = await verifyPassword(
          resetPassword,
          settings.user.passwordHash
        );
        if (!isVerified) {
          setResetPasswordError(t('incorrectPassword'));
          setIsLoading(false);
          return;
        }
      }

      await Promise.all(db.tables.map((table) => table.clear()));
      sessionStorage.clear();
      toast({title: t('toastAppReset'), description: t('toastAppResetDesc')});

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Failed to reset data:', error);
      toast({
        title: t('toastResetFailed'),
        description: t('toastResetFailedDesc'),
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  if (isTriggered) {
    return (
      <>
        <Dialog
          open={isExportOpen}
          onOpenChange={(isOpen) => {
            setIsExportOpen(isOpen);
            if (!isOpen) exportForm.reset();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('secureExport')}</DialogTitle>
              <DialogDescription>
                {isMasterPasswordSet
                  ? t('secureExportPasswordPrompt')
                  : t('secureExportDescription')}
              </DialogDescription>
            </DialogHeader>
            <Form {...exportForm}>
              <form
                onSubmit={exportForm.handleSubmit(handleExport)}
                className="space-y-4 pt-4"
              >
                {settings.devMode && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="encrypt-switch"
                      checked={shouldEncrypt}
                      onCheckedChange={setShouldEncrypt}
                    />
                    <Label htmlFor="encrypt-switch">{t('encryptData')}</Label>
                  </div>
                )}
                {shouldEncrypt && (
                  <FormField
                    control={exportForm.control}
                    name="password"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>{t('masterPassword')}</FormLabel>
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
                  {shouldEncrypt
                    ? t('encryptAndExport')
                    : t('exportUnencrypted')}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

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
              <DialogTitle>{t('secureImport')}</DialogTitle>
              <DialogDescription>
                {t('secureImportDescription')}
              </DialogDescription>
            </DialogHeader>
            <Form {...importForm}>
              <form
                onSubmit={importForm.handleSubmit(handlePasswordImport)}
                className="space-y-4 pt-4"
              >
                <p className="text-sm text-muted-foreground">
                  {t('unencryptedImportNote')}
                </p>
                <FormField
                  control={importForm.control}
                  name="password"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>{t('decryptionPassword')}</FormLabel>
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
                  {t('decryptAndImport')}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isPasswordFormOpen} onOpenChange={setIsPasswordFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('setPassword')}</DialogTitle>
              <DialogDescription>{t('setPasswordToExport')}</DialogDescription>
            </DialogHeader>
            <PasswordManager
              onPasswordSet={() => {
                setIsPasswordFormOpen(false);
                setIsExportOpen(true);
              }}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('dataManagement')}</CardTitle>
          <CardDescription>{t('dataManagementDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Button variant="outline" onClick={handleExportClick}>
            <Download className="mr-2 h-4 w-4" /> {t('exportData')}
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {t('importData')}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".coinkeeper,.json"
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* EXPORT DIALOG */}
      <Dialog
        open={isExportOpen}
        onOpenChange={(isOpen) => {
          setIsExportOpen(isOpen);
          if (!isOpen) exportForm.reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('secureExport')}</DialogTitle>
            <DialogDescription>
              {isMasterPasswordSet
                ? t('secureExportPasswordPrompt')
                : t('secureExportDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...exportForm}>
            <form
              onSubmit={exportForm.handleSubmit(handleExport)}
              className="space-y-4 pt-4"
            >
              {settings.devMode && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="encrypt-switch-main"
                    checked={shouldEncrypt}
                    onCheckedChange={setShouldEncrypt}
                  />
                  <Label htmlFor="encrypt-switch-main">
                    {t('encryptData')}
                  </Label>
                </div>
              )}
              {shouldEncrypt && (
                <FormField
                  control={exportForm.control}
                  name="password"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>{t('masterPassword')}</FormLabel>
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
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {shouldEncrypt ? t('encryptAndExport') : t('exportUnencrypted')}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* IMPORT DIALOG */}
      <Dialog
        open={isImportOpen}
        onOpenChange={(isOpen) => {
          setIsImportOpen(isOpen);
          if (!isOpen) importForm.reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('secureImport')}</DialogTitle>
            <DialogDescription>
              {t('secureImportDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...importForm}>
            <form
              onSubmit={importForm.handleSubmit(handlePasswordImport)}
              className="space-y-4 pt-4"
            >
              <p className="text-sm text-muted-foreground">
                {t('unencryptedImportNote')}
              </p>
              <FormField
                control={importForm.control}
                name="password"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>{t('decryptionPassword')}</FormLabel>
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
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('decryptAndImport')}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* SET PASSWORD DIALOG */}
      <Dialog open={isPasswordFormOpen} onOpenChange={setIsPasswordFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('setPassword')}</DialogTitle>
            <DialogDescription>{t('setPasswordToExport')}</DialogDescription>
          </DialogHeader>
          <PasswordManager
            onPasswordSet={() => {
              setIsPasswordFormOpen(false);
              setIsExportOpen(true);
            }}
          />
        </DialogContent>
      </Dialog>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle />
            {t('dangerZone')}
          </CardTitle>
          <CardDescription>{t('dangerZoneDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog
            open={isResetConfirmOpen}
            onOpenChange={setIsResetConfirmOpen}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> {t('resetAllData')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('areYouAbsolutelySure')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('resetDataWarning')}{' '}
                  {settings.user?.passwordHash && t('resetDataPasswordConfirm')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {settings.user?.passwordHash && (
                <div className="space-y-2">
                  <Label htmlFor="reset-password">{t('password')}</Label>
                  <div className="relative">
                    <Input
                      id="reset-password"
                      type={showResetPassword ? 'text' : 'password'}
                      value={resetPassword}
                      onChange={(e) => {
                        setResetPassword(e.target.value);
                        setResetPasswordError(null);
                      }}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:bg-transparent"
                      onClick={() => setShowResetPassword((prev) => !prev)}
                    >
                      {showResetPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </Button>
                  </div>
                  {resetPasswordError && (
                    <p className="text-sm text-destructive">
                      {resetPasswordError}
                    </p>
                  )}
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setResetPassword('');
                    setResetPasswordError(null);
                  }}
                >
                  {t('cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    if (settings.user?.passwordHash) e.preventDefault();
                    handleResetData();
                  }}
                  disabled={isLoading}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('confirmDeleteAllData')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </>
  );
}
