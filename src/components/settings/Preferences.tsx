
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTheme } from "next-themes"
import React, { useState, useEffect } from "react";

import { useSettings } from "@/context/SettingsContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast-internal"
import { BellRing, Monitor, Moon, Sun, CheckCircle, XCircle, Code, Timer } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/hooks/use-translation"
import { Switch } from "@/components/ui/switch"
import { Input } from "../ui/input"
import { cn } from "@/lib/utils";
import { ThemeToggle } from "../layout/ThemeToggle"

const preferencesSchema = z.object({
  currency: z.enum(["USD", "IDR", "EUR"]),
  language: z.enum(["en", "id"]),
  theme: z.enum(['light', 'dark', 'system']),
  timeFormat: z.enum(['12h', '24h']),
  hideAmounts: z.boolean(),
  numberFormat: z.enum(['IDR', 'USD']),
  decimalPlaces: z.coerce.number().min(0).max(10),
  devMode: z.boolean(),
  toastDuration: z.coerce.number().min(100, "Duration must be at least 100ms"),
})

type PreferencesFormValues = z.infer<typeof preferencesSchema>;

export function Preferences() {
  const { settings, updateSettings } = useSettings()
  const { t } = useTranslation();
  const [notificationPermission, setNotificationPermission] = useState('default');
  const { setTheme } = useTheme();

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: settings,
  });

  useEffect(() => {
    form.reset(settings);
  }, [settings, form]);

  const onSubmit = (data: PreferencesFormValues) => {
    setTheme(data.theme);
    updateSettings(data);
    toast({
      title: t('toastPreferencesSaved'),
      description: t('toastPreferencesSavedDesc'),
    });
  };

  const handleNotificationRequest = () => {
    if (!("Notification" in window)) {
      toast({ title: t('unsupported'), description: t('browserDoesNotSupportNotifications'), variant: "destructive" });
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
        if (permission === "granted") {
          toast({ title: t('toastNotificationsEnabled'), description: t('toastNotificationsEnabledDesc') });
        }
      });
    }
  };

  const handleTestNotification = () => {
    if (notificationPermission === 'granted') {
      new Notification(t('testNotificationTitle'), {
        body: t('testNotificationBody'),
      });
    }
  };

  const renderNotificationButton = () => {
    if (notificationPermission === 'granted') {
      return (
        <div className="flex items-center gap-2">
          <Button disabled>
            <CheckCircle className="mr-2 h-4 w-4" />
            {t('notificationsEnabled')}
          </Button>
          <Button variant="outline" onClick={handleTestNotification}>
            {t('testNotification')}
          </Button>
        </div>
      );
    }
    if (notificationPermission === 'denied') {
      return (
        <Button variant="destructive" disabled>
          <XCircle className="mr-2 h-4 w-4" />
          {t('notificationsBlocked')}
        </Button>
      );
    }
    return (
      <Button onClick={handleNotificationRequest}>
        <BellRing className="mr-2 h-4 w-4" />
        {t('enableNotifications')}
      </Button>
    );
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('generalPreferences')}</CardTitle>
                        <CardDescription>
                            {t('manageApplicationSettings')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('currency')}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder={t('selectACurrency')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="USD">USD - United States Dollar</SelectItem>
                                    <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
                                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="numberFormat"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('numberFormat')}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder={t('selectAFormat')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="IDR">{t('numberFormatIDR')}</SelectItem>
                                    <SelectItem value="USD">{t('numberFormatUSD')}</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="decimalPlaces"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('decimalPlaces')}</FormLabel>
                                <FormControl>
                                <Input type="number" min="0" max="10" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="hideAmounts"
                            render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                <FormLabel>{t('hideBalance')}</FormLabel>
                                <FormMessage />
                                </div>
                                <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('devModeSettings')}</CardTitle>
                        <CardDescription>{t('devModeSettingsDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="devMode"
                            render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                <FormLabel className="flex items-center gap-2"><Code /> {t('devMode')}</FormLabel>
                                <p className="text-xs text-muted-foreground">{t('devModeDescription')}</p>
                                <FormMessage />
                                </div>
                                <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-6">
              <Card>
                  <CardHeader>
                      <CardTitle>{t('appearance')}</CardTitle>
                      <CardDescription>{t('selectYourPreferredColorScheme')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('language')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('selectALanguage')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="id">Bahasa Indonesia</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="timeFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('timeFormat')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('selectALanguage')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="12h">{t('hour12')}</SelectItem>
                              <SelectItem value="24h">{t('hour24')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>{t('theme')}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid max-w-md grid-cols-3 gap-8 pt-2"
                            >
                              <FormItem>
                                <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                                  <FormControl>
                                    <RadioGroupItem value="light" className="sr-only" />
                                  </FormControl>
                                  <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                                    <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                                      <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                                        <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                                        <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                                      </div>
                                      <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                                        <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                                        <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                                      </div>
                                      <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                                        <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                                        <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                                      </div>
                                    </div>
                                  </div>
                                  <span className="block w-full p-2 text-center font-normal">{t('light')}</span>
                                </FormLabel>
                              </FormItem>
                              <FormItem>
                                <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                                  <FormControl>
                                    <RadioGroupItem value="dark" className="sr-only" />
                                  </FormControl>
                                  <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:border-accent">
                                    <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                                      <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                                        <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                                        <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                                      </div>
                                      <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                                        <div className="h-4 w-4 rounded-full bg-slate-400" />
                                        <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                                      </div>
                                      <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                                        <div className="h-4 w-4 rounded-full bg-slate-400" />
                                        <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                                      </div>
                                    </div>
                                  </div>
                                  <span className="block w-full p-2 text-center font-normal">{t('dark')}</span>
                                </FormLabel>
                              </FormItem>
                              <FormItem>
                                <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                                  <FormControl>
                                    <RadioGroupItem value="system" className="sr-only" />
                                  </FormControl>
                                  <div className="flex h-[116px] items-center justify-center rounded-md border-2 border-muted bg-muted p-1 text-muted-foreground hover:border-accent">
                                    <Monitor size={48} />
                                  </div>
                                  <span className="block w-full p-2 text-center font-normal">{t('system')}</span>
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader>
                      <CardTitle>{t('notifications')}</CardTitle>
                      <CardDescription>{t('manageNotificationSettings')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <div>
                          <h3 className="text-sm font-medium mb-2">{t('budgetAlerts')}</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                              {t('getNotifiedOnBudgetLimits')}
                          </p>
                          {renderNotificationButton()}
                      </div>
                      <FormField
                          control={form.control}
                          name="toastDuration"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                  <Timer /> {t('toastDuration')}
                              </FormLabel>
                              <FormControl>
                                  <Input
                                    type="number"
                                    min="100"
                                    step="100"
                                    {...field}
                                    value={field.value ?? ''}
                                  />
                              </FormControl>
                              <p className="text-xs text-muted-foreground">{t('toastDurationDescription')}</p>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                  </CardContent>
              </Card>
            </div>
        </div>
        <Button type="submit" className="w-full">{t('savePreferences')}</Button>
      </form>
    </Form>
  );
}
