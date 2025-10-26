"use client";

import {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {KeyRound, Lock, Unlock, AlertTriangle} from "lucide-react";

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

export function PasswordManager() {
  const {settings, updateSettings} = useSettings();
  const {t} = useTranslation();
  const [isFormVisible, setIsFormVisible] = useState(false);
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
          message: "Incorrect current password.",
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
      title: "Master Password Set!",
      description: "Your application is now password protected.",
    });
    setIsFormVisible(false);
    form.reset();
  };

  const handleRemovePassword = async () => {
    await updateSettings({passwordHash: null, passwordHint: null});
    toast({
      title: "Master Password Removed",
      description: "Your application is no longer password protected.",
    });
    setIsFormVisible(false);
  };

  const formContent = (
    <Form {...form}>
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Important: Password Recovery</AlertTitle>
        <AlertDescription>
          This application has no central server. If you forget your master
          password, it **cannot be recovered**. You will permanently lose access
          to your data unless you have an unencrypted backup. Please store your
          password and hint in a safe place.
        </AlertDescription>
      </Alert>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {isPasswordSet && (
          <FormField
            control={form.control}
            name="currentPassword"
            render={({field}) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
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
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
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
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
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
              <FormLabel>Password Hint (Optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="A hint to help you remember" />
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
            Cancel
          </Button>
          <Button type="submit">Set Password</Button>
        </div>
      </form>
    </Form>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Master Password</CardTitle>
        <CardDescription>
          {isPasswordSet
            ? "Your application is password protected. You can change or remove your master password here."
            : "Set a master password to secure your application. This is optional."}
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
              {isPasswordSet ? "Change Password" : "Set Password"}
            </Button>
            {isPasswordSet && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Unlock className="mr-2" />
                    Remove Password
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to remove the password?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Your application will no longer be password protected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemovePassword}>
                      Continue
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
