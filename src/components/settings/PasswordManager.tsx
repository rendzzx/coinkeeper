"use client";

import {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {KeyRound, Lock, Unlock, AlertTriangle, Eye, EyeOff} from "lucide-react";

import {useSettings} from "@/context/SettingsContext";
import {hashPassword, verifyPassword} from "@/lib/encryption";
import {useTranslation} from "@/hooks/use-translation";
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
import {Input} from "@/components/ui/input";
import {toast} from "@/hooks/use-toast-internal";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
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

const passwordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
    passwordHint: z.string().optional(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

function PasswordInput({
  field,
  placeholder,
  show,
  onToggle,
}: {
  field: any;
  placeholder: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        {...field}
        placeholder={placeholder}
        className="pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:bg-transparent"
        onClick={onToggle}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </Button>
    </div>
  );
}

export function PasswordManager() {
  const {settings, updateSettings} = useSettings();
  const {t} = useTranslation();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isPasswordSet = !!settings.passwordHash;

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      passwordHint: settings.passwordHint || "",
    },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    if (isPasswordSet) {
      const isVerified = await verifyPassword(
        data.currentPassword || "",
        settings.passwordHash!
      );
      if (!isVerified) {
        form.setError("currentPassword", {
          type: "manual",
          message: t("incorrectCurrentPassword"),
        });
        return;
      }
    }

    const newHash = await hashPassword(data.newPassword);
    await updateSettings({
      passwordHash: newHash,
      passwordHint: data.passwordHint || null,
    });

    toast({
      title: t("passwordSetSuccess"),
      description: t("passwordSetSuccessDesc"),
    });
    setIsFormVisible(false);
    form.reset();
  };

  const handleRemovePassword = async () => {
    await updateSettings({passwordHash: null, passwordHint: null});
    toast({
      title: t("passwordRemovedSuccess"),
      description: t("passwordRemovedSuccessDesc"),
    });
    setIsFormVisible(false);
  };

  const formContent = (
    <Form {...form}>
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t("importantPasswordRecovery")}</AlertTitle>
        <AlertDescription>{t("passwordRecoveryWarning")}</AlertDescription>
      </Alert>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {isPasswordSet && (
          <FormField
            control={form.control}
            name="currentPassword"
            render={({field}) => (
              <FormItem>
                <FormLabel>{t("currentPassword")}</FormLabel>
                <FormControl>
                  <PasswordInput
                    field={field}
                    placeholder="********"
                    show={showCurrentPassword}
                    onToggle={() => setShowCurrentPassword((p) => !p)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="newPassword"
          render={({field}) => (
            <FormItem>
              <FormLabel>{t("newPassword")}</FormLabel>
              <FormControl>
                <PasswordInput
                  field={field}
                  placeholder="********"
                  show={showNewPassword}
                  onToggle={() => setShowNewPassword((p) => !p)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({field}) => (
            <FormItem>
              <FormLabel>{t("confirmPassword")}</FormLabel>
              <FormControl>
                <PasswordInput
                  field={field}
                  placeholder="********"
                  show={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((p) => !p)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="passwordHint"
          render={({field}) => (
            <FormItem>
              <FormLabel>{t("passwordHint")}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t("passwordHintPlaceholder")} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsFormVisible(false)}
          >
            {t("cancel")}
          </Button>
          <Button type="submit">{t("setPassword")}</Button>
        </div>
      </form>
    </Form>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("masterPassword")}</CardTitle>
        <CardDescription>
          {isPasswordSet ? t("masterPasswordSet") : t("masterPasswordNotSet")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isFormVisible ? (
          formContent
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setIsFormVisible(true)}>
              {isPasswordSet ? (
                <KeyRound className="mr-2" />
              ) : (
                <Lock className="mr-2" />
              )}
              {isPasswordSet ? t("changePassword") : t("setPassword")}
            </Button>
            {isPasswordSet && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Unlock className="mr-2" />
                    {t("removePassword")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("removePasswordConfirmTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("removePasswordConfirmDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemovePassword}>
                      {t("continue")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
