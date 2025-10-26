"use client";

import {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {AnimatePresence, motion} from "framer-motion";
import {KeyRound, Lightbulb, Eye, EyeOff} from "lucide-react";
import {verifyPassword} from "@/lib/encryption";
import {useTranslation} from "@/hooks/use-translation";
import {AnimatedLogo} from "../icons/AnimatedLogo";
import {Input} from "../ui/input";
import {Button} from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LockScreenProps {
  passwordHash: string;
  passwordHint: string | null;
  onUnlock: () => void;
}

const lockScreenSchema = z.object({
  password: z.string().min(1, "Password cannot be empty."),
});

type LockScreenFormValues = z.infer<typeof lockScreenSchema>;

export function LockScreen({
  passwordHash,
  passwordHint,
  onUnlock,
}: LockScreenProps) {
  const {t} = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LockScreenFormValues>({
    resolver: zodResolver(lockScreenSchema),
    defaultValues: {password: ""},
  });

  const onSubmit = async (data: LockScreenFormValues) => {
    setError(null);
    const isValid = await verifyPassword(data.password, passwordHash);
    if (isValid) {
      onUnlock();
    } else {
      setError(t("incorrectPassword"));
      form.reset();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-background p-4"
      >
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <AnimatedLogo />
            </div>
            <CardTitle className="text-2xl font-headline">
              {t("welcomeBack")}
            </CardTitle>
            <CardDescription>{t("unlockAppDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel className="sr-only">{t("password")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder={t("password")}
                            className="pl-10 pr-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:bg-transparent"
                            onClick={() => setShowPassword((prev) => !prev)}
                          >
                            {showPassword ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && (
                  <p className="text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full">
                  {t("unlock")}
                </Button>
              </form>
            </Form>
          </CardContent>
          {passwordHint && (
            <CardFooter className="justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-muted-foreground cursor-help flex items-center gap-1">
                      <Lightbulb size={14} /> {t("passwordHintLabel")}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{passwordHint}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
