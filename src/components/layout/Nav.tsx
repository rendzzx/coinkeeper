
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTranslation } from "@/hooks/use-translation";
import { useSettings } from "@/context/SettingsContext";
import type { TranslationKey } from "@/lib/i18n";
import { ALL_NAV_ITEMS } from "@/lib/config-data";
import { useAppContext } from "@/context/AppContext";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { setOpenMobile, isMobile } = useSidebar();
  const { setIsPageTransitioning } = useAppContext();
  
  if (!settings?.navItemOrder) {
    return null; // or a loading skeleton
  }

  const orderedNavItems = settings.navItemOrder
    .map(id => ALL_NAV_ITEMS.find(item => item.id === id))
    .filter(Boolean);

  const handleLinkClick = (href: string) => {
    if (isMobile) {
      setOpenMobile(false);
    }
    // Only show transition if it's a different page
    if (pathname !== href) {
      setIsPageTransitioning(true);
    }
  };

  return (
    <SidebarMenu className="gap-2 p-2">
      {orderedNavItems.map((item) => {
        if (!item) return null;
        const Icon = (LucideIcons[item.icon as keyof typeof LucideIcons] as React.ElementType) || LucideIcons.HelpCircle;
        const translatedLabel = t(item.label as TranslationKey);

        return (
            <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={translatedLabel}
                onClick={() => handleLinkClick(item.href)}
            >
                <Link href={item.href}>
                <Icon />
                <span>{translatedLabel}</span>
                </Link>
            </SidebarMenuButton>
            </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  );
}
