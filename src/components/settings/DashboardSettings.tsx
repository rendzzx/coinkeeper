
"use client";

import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { DashboardCardKey } from "@/lib/types";
import { ALL_DASHBOARD_CARDS } from "@/lib/config-data";
import { TranslationKey } from "@/lib/i18n";

export function DashboardSettings() {
    const { settings, updateSettings } = useSettings();
    const { t } = useTranslation();
    const { dashboardCardVisibility } = settings;

    const handleToggle = (cardId: DashboardCardKey, checked: boolean) => {
        const newVisibility = {
            ...dashboardCardVisibility,
            [cardId]: checked
        };
        
        updateSettings({
            dashboardCardVisibility: newVisibility
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('dashboard')} {t('settings')}</CardTitle>
                <CardDescription>{t('dashboardSettingsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                {ALL_DASHBOARD_CARDS.map((card) => (
                    <div key={card.id} className="flex items-center justify-between space-x-2 p-4 border rounded-md">
                        <Label htmlFor={card.id} className="flex flex-col space-y-1">
                            <span>{t(card.label as TranslationKey)}</span>
                        </Label>
                        <Switch
                            id={card.id}
                            checked={dashboardCardVisibility[card.id] ?? true}
                            onCheckedChange={(checked) => handleToggle(card.id, checked)}
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
