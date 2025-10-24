"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Settings, History } from "lucide-react";

import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import {
    Sidebar,
    SidebarProvider,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarSeparator,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/icons/Logo";
import { AnimatedLogo } from "@/components/icons/AnimatedLogo";
import { Nav } from "@/components/layout/Nav";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { AppContextLoader } from "@/context/AppContextLoader";
import { useSettings } from "@/context/SettingsContext";
import { PageTransitionLoader } from "@/components/layout/PageTransitionLoader";
import { useAppContext } from "@/context/AppContext";

function AppHeader() {
    const { isMobile, toggleSidebar } = useSidebar();
    return (
        <header
            className={cn(
                "sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:hidden"
            )}
        >
            {isMobile && (
                <>
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={toggleSidebar}
                        className="sm:hidden"
                        asChild
                    >
                        <SidebarTrigger>
                            <span className="sr-only">Toggle Menu</span>
                        </SidebarTrigger>
                    </Button>
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 font-semibold md:text-base"
                    >
                        <Logo className="h-6 w-6" />
                        <span>CoinKeeper</span>
                    </Link>
                </>
            )}
        </header>
    );
}

function AppSidebarFooter() {
    const pathname = usePathname();
    const { t } = useTranslation();
    const { isMobile, setOpenMobile } = useSidebar();
    const { setIsPageTransitioning } = useAppContext();

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
        <SidebarFooter>
            <SidebarSeparator className="my-2" />
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname === "/history"}
                        size="lg"
                        onClick={() => handleLinkClick("/history")}
                    >
                        <Link href="/history">
                            <History />
                            <span>{t("history")}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname === "/settings"}
                        size="lg"
                        onClick={() => handleLinkClick("/settings")}
                    >
                        <Link href="/settings">
                            <Settings />
                            <span>{t("settings")}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
    );
}

function AppSidebarContent() {
    return (
        <SidebarContent>
            <Nav />
        </SidebarContent>
    );
}

function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    if (pathname === "/") return <>{children}</>;

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <Sidebar>
                    <SidebarHeader className="p-4 hidden sm:block">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2"
                        >
                            <Logo className="w-8 h-8 text-primary" />
                            <span className="font-headline font-semibold text-xl text-primary">
                                CoinKeeper
                            </span>
                        </Link>
                    </SidebarHeader>
                    <AppSidebarContent />
                    <AppSidebarFooter />
                </Sidebar>
                <div className="flex flex-col flex-1 w-full">
                    <AppHeader />
                    <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
                </div>
            </div>
        </SidebarProvider>
    );
}

function ThemeSync() {
    const { settings } = useSettings();
    const { setTheme } = useTheme();

    useEffect(() => {
        if (settings?.theme) {
            setTheme(settings.theme);
        }
    }, [settings?.theme, setTheme]);

    return null;
}

// InnerLayout now provides the final layout structure and manages loaders.
function InnerLayout({ children }: { children: React.ReactNode }) {
    const { state, pageTitle } = useAppContext(); // Using context to know when data is ready
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // This effect determines if the initial big loading screen should be shown.
    // It checks if the core data from the context has been loaded.
    useEffect(() => {
        // Check if essential data is loaded. `state.categories` is a good proxy.
        if (state && state.categories.length > 0) {
            const timer = setTimeout(() => {
                setIsInitialLoading(false);
            }, 500); // A small delay to prevent flickering
            return () => clearTimeout(timer);
        }
    }, [state]);

    useEffect(() => {
        if (pageTitle) {
            document.title = `${pageTitle} | CoinKeeper`;
        } else {
            document.title = "CoinKeeper";
        }
    }, [pageTitle]);

    return (
        <>
            <div
                className={cn(
                    "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-300",
                    isInitialLoading
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none"
                )}
            >
                <AnimatedLogo text={true} />
            </div>

            <PageTransitionLoader>
                {!isInitialLoading && (
                    <AppLayout>
                        <ThemeSync />
                        {children}
                    </AppLayout>
                )}
            </PageTransitionLoader>

            <Toaster />
        </>
    );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppContextLoader>
            <InnerLayout>{children}</InnerLayout>
        </AppContextLoader>
    );
}
