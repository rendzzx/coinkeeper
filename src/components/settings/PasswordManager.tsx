"use client";

import {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {
  KeyRound,
  Lock,
  Unlock,
  AlertTriangle,
  Eye,
  EyeOff,
  Timer,
} from "lucide-react";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {Separator} from "../ui/separator";

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

const removePasswordSchema = z.object({
  password: z.string().min(1, "Password cannot be empty."),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;
type RemovePasswordFormValues = z.infer<typeof removePasswordSchema>;

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

function AutoLockCard() {
  const {settings, updateSettings} = useSettings();
  const {t} = useTranslation();

  const handleTimeoutChange = (value: string) => {
    updateSettings({autoLockTimeout: Number(value)});
  };

  if (!settings.passwordHash) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("autoLock")}</CardTitle>
        <CardDescription>{t("autoLockDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full max-w-sm">
          <Select
            value={String(settings.autoLockTimeout)}
            onValueChange={handleTimeoutChange}
          >
            <SelectTrigger>
              <Timer className="mr-2" />
              <SelectValue placeholder={t("selectTimeout")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{t("never")}</SelectItem>
              <SelectItem value="30">30 {t("seconds")}</SelectItem>
              <SelectItem value="300">5 {t("minutes")}</SelectItem>
              <SelectItem value="600">10 {t("minutes")}</SelectItem>
              <SelectItem value="900">15 {t("minutes")}</SelectItem>
              <SelectItem value="1800">30 {t("minutes")}</SelectItem>
              <SelectItem value="3600">60 {t("minutes")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

export function PasswordManager() {
  const {settings, updateSettings} = useSettings();
  const {t} = useTranslation();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRemovePassword, setShowRemovePassword] = useState(false);
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

  const removeForm = useForm<RemovePasswordFormValues>({
    resolver: zodResolver(removePasswordSchema),
    defaultValues: {password: ""},
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

  const handleRemovePassword = async (data: RemovePasswordFormValues) => {
    const isVerified = await verifyPassword(
      data.password,
      settings.passwordHash!
    );
    if (!isVerified) {
      removeForm.setError("password", {
        type: "manual",
        message: t("incorrectCurrentPassword"),
      });
      return;
    }

    await updateSettings({
      passwordHash: null,
      passwordHint: null,
      autoLockTimeout: 0,
    });
    toast({
      title: t("passwordRemovedSuccess"),
      description: t("passwordRemovedSuccessDesc"),
    });
    setIsRemoveConfirmOpen(false);
    removeForm.reset();
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <Dialog
                  open={isRemoveConfirmOpen}
                  onOpenChange={setIsRemoveConfirmOpen}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {t("removePasswordConfirmTitle")}
                      </DialogTitle>
                      <DialogDescription>
                        {t("removePasswordConfirmDesc")}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...removeForm}>
                      <form
                        onSubmit={removeForm.handleSubmit(handleRemovePassword)}
                        className="space-y-4"
                      >
                        <FormField
                          control={removeForm.control}
                          name="password"
                          render={({field}) => (
                            <FormItem>
                              <FormLabel>{t("currentPassword")}</FormLabel>
                              <FormControl>
                                <PasswordInput
                                  field={field}
                                  placeholder="********"
                                  show={showRemovePassword}
                                  onToggle={() =>
                                    setShowRemovePassword((p) => !p)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsRemoveConfirmOpen(false)}
                          >
                            {t("cancel")}
                          </Button>
                          <Button type="submit" variant="destructive">
                            {t("removePassword")}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                  <Button
                    variant="destructive"
                    onClick={() => setIsRemoveConfirmOpen(true)}
                  >
                    <Unlock className="mr-2" />
                    {t("removePassword")}
                  </Button>
                </Dialog>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AutoLockCard />
    </div>
  );
}
