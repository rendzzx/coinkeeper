"use client";

import {Header} from "@/components/layout/Header";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {CategoryManager} from "@/components/settings/CategoryManager";
import {TagManager} from "@/components/settings/TagManager";
import {Preferences} from "@/components/settings/Preferences";
import {DataManagement} from "@/components/settings/DataManagement";
import {DashboardSettings} from "@/components/settings/DashboardSettings";
import {useTranslation} from "@/hooks/use-translation";
import {WalletTypeManager} from "@/components/settings/WalletTypeManager";
import {SidebarSettings} from "@/components/settings/SidebarSettings";
import {PasswordManager} from "@/components/settings/PasswordManager";

export default function SettingsPage() {
  const {t} = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <Header title={t("settings")} />
      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preferences">{t("preferences")}</TabsTrigger>
          <TabsTrigger value="appearance">{t("appearance")}</TabsTrigger>
          <TabsTrigger value="data">{t("data")}</TabsTrigger>
        </TabsList>
        <TabsContent value="preferences">
          <Preferences />
        </TabsContent>
        <TabsContent value="appearance">
          <Tabs defaultValue="dashboard">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dashboard">{t("dashboard")}</TabsTrigger>
              <TabsTrigger value="sidebar">{t("sidebar")}</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard">
              <DashboardSettings />
            </TabsContent>
            <TabsContent value="sidebar">
              <SidebarSettings />
            </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="data" className="space-y-6">
          <Tabs defaultValue="categories">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="categories">{t("categories")}</TabsTrigger>
              <TabsTrigger value="wallets">{t("walletTypes")}</TabsTrigger>
              <TabsTrigger value="tags">{t("tags")}</TabsTrigger>
            </TabsList>
            <TabsContent value="categories">
              <CategoryManager />
            </TabsContent>
            <TabsContent value="wallets">
              <WalletTypeManager />
            </TabsContent>
            <TabsContent value="tags">
              <TagManager />
            </TabsContent>
          </Tabs>
          <PasswordManager />
          <DataManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
