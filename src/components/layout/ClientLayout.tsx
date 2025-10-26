'use client';

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {usePathname} from 'next/navigation';
import Link from 'next/link';
import {useTheme} from 'next-themes';
import {Settings, History, Lock, Download, Upload} from 'lucide-react';

import {cn} from '@/lib/utils';
import {Toaster} from '@/components/ui/toaster';
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
} from '@/components/ui/sidebar';
import {Logo} from '@/components/icons/Logo';
import {AnimatedLogo} from '@/components/icons/AnimatedLogo';
import {Nav} from '@/components/layout/Nav';
import {Button} from '@/components/ui/button';
import {useTranslation} from '@/hooks/use-translation';
import {AppContextLoader} from '@/context/AppContextLoader';
import {useSettings} from '@/context/SettingsContext';
import {PageTransitionLoader} from '@/components/layout/PageTransitionLoader';
import {useAppContext} from '@/context/AppContext';
import {LockScreen} from '@/components/layout/LockScreen';
import useIdle from '@/hooks/use-idle';
import {DataManagement} from '../settings/DataManagement';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {AutoLockWarning} from './AutoLockWarning';
import {PasswordManager} from '../settings/PasswordManager';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

function AppHeader() {
  const {isMobile, toggleSidebar} = useSidebar();
  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:hidden'
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
  const {t} = useTranslation();
  const {isMobile, setOpenMobile} = useSidebar();
  const {setIsPageTransitioning, handleLock, handleExport, handleImport} =
    useAppContext();
  const {settings} = useSettings();
  const isPasswordSet = !!settings.user?.passwordHash;

  const handleLinkClick = (href: string) => {
    if (isMobile) {
      setOpenMobile(false);
    }
    if (pathname !== href) {
      setIsPageTransitioning(true);
    }
  };

  const iconButtonClass =
    'h-9 w-9 data-[state=collapsed]:h-9 data-[state=collapsed]:w-9 group-data-[collapsible=icon]/sidebar:h-9 group-data-[collapsible=icon]/sidebar:w-9';

  const buttons = (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={iconButtonClass}
        onClick={handleLock}
        disabled={!isPasswordSet}
        aria-label={t('lock')}
      >
        <Lock />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={iconButtonClass}
        onClick={handleExport}
        aria-label={t('exportData')}
      >
        <Download />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={iconButtonClass}
        onClick={handleImport}
        aria-label={t('importData')}
      >
        <Upload />
      </Button>
    </>
  );

  const buttonsWithTooltips = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={iconButtonClass}
            onClick={handleLock}
            disabled={!isPasswordSet}
            aria-label={t('lock')}
          >
            <Lock />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">
          {t('lock')}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={iconButtonClass}
            onClick={handleExport}
            aria-label={t('exportData')}
          >
            <Download />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">
          {t('exportData')}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={iconButtonClass}
            onClick={handleImport}
            aria-label={t('importData')}
          >
            <Upload />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">
          {t('importData')}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={pathname === '/history'}
            size="lg"
            onClick={() => handleLinkClick('/history')}
          >
            <Link href="/history">
              <History />
              <span>{t('history')}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={pathname === '/settings'}
            size="lg"
            onClick={() => handleLinkClick('/settings')}
          >
            <Link href="/settings">
              <Settings />
              <span>{t('settings')}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <SidebarSeparator className="my-1" />
      <div className="flex justify-center items-center gap-1 p-2 group-data-[collapsible=icon]/sidebar:flex-col">
        {!isMobile ? buttonsWithTooltips : buttons}
      </div>
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

function AppLayout({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  if (pathname === '/') return <>{children}</>;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4 hidden sm:block">
            <Link href="/dashboard" className="flex items-center gap-2">
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
  const {settings} = useSettings();
  const {setTheme} = useTheme();

  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme);
    }
  }, [settings?.theme, setTheme]);

  return null;
}

function InnerLayout({children}: {children: React.ReactNode}) {
  const {state, pageTitle, setHandleLock, setHandleExport, setHandleImport} =
    useAppContext();
  const {settings} = useSettings();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const timeout = (settings.user?.autoLockTimeout ?? 0) * 1000;
  const {isIdle, isPrompting, countdown, resetTimers} = useIdle(timeout, 15000);

  useEffect(() => {
    if (settings.user?.passwordHash) {
      setIsLocked(true);
    }
  }, [settings.user?.passwordHash]);

  useEffect(() => {
    if (state && state.categories.length > 0) {
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state]);

  useEffect(() => {
    if (pageTitle) {
      document.title = `${pageTitle} | CoinKeeper`;
    } else {
      document.title = 'CoinKeeper';
    }
  }, [pageTitle]);

  useEffect(() => {
    if (isIdle && settings.user?.passwordHash && !isLocked) {
      setIsLocked(true);
    }
  }, [isIdle, settings.user?.passwordHash, isLocked]);

  const handleUnlock = useCallback(() => {
    setIsLocked(false);
    resetTimers();
  }, [resetTimers]);

  useEffect(() => {
    const handleLock = () => {
      if (settings.user?.passwordHash) {
        setIsLocked(true);
      }
    };

    const handleExport = () => {
      if (settings.user?.passwordHash) {
        setIsExportOpen(true);
      } else {
        setIsPasswordFormOpen(true);
      }
    };

    const handleImport = () => {
      fileInputRef.current?.click();
    };

    setHandleLock(() => handleLock);
    setHandleExport(() => handleExport);
    setHandleImport(() => handleImport);
  }, [
    settings.user?.passwordHash,
    setHandleLock,
    setHandleExport,
    setHandleImport,
  ]);

  const handleStay = () => {
    resetTimers();
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-300',
          isInitialLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <AnimatedLogo text={true} />
      </div>

      {!isInitialLoading && isLocked && settings.user?.passwordHash && (
        <LockScreen
          passwordHash={settings.user.passwordHash}
          passwordHint={settings.user.passwordHint}
          onUnlock={handleUnlock}
        />
      )}

      {!isInitialLoading &&
        !isLocked &&
        settings.user?.passwordHash &&
        timeout > 0 && (
          <AutoLockWarning
            isOpen={isPrompting}
            countdown={countdown}
            onStay={handleStay}
          />
        )}

      <DataManagement
        isExportOpen={isExportOpen}
        setIsExportOpen={setIsExportOpen}
        importTriggerRef={fileInputRef}
        isTriggered={true}
      />

      <Dialog open={isPasswordFormOpen} onOpenChange={setIsPasswordFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Master Password</DialogTitle>
            <DialogDescription>
              You must set a master password to export data securely.
            </DialogDescription>
          </DialogHeader>
          <PasswordManager
            onPasswordSet={() => {
              setIsPasswordFormOpen(false);
              setIsExportOpen(true);
            }}
          />
        </DialogContent>
      </Dialog>

      <PageTransitionLoader>
        {!isInitialLoading && !isLocked && (
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

export function ClientLayout({children}: {children: React.ReactNode}) {
  return (
    <AppContextLoader>
      <InnerLayout>{children}</InnerLayout>
    </AppContextLoader>
  );
}
