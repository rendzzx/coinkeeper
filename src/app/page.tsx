'use client';

import {useEffect} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {Logo} from '@/components/icons/Logo';
import {
  ArrowRight,
  BarChart,
  ShieldCheck,
  Smartphone,
  Globe,
  ChevronsUpDown,
  Check,
  CalendarClock,
  Landmark,
  PieChart,
} from 'lucide-react';
import {useTranslation} from '@/hooks/use-translation';
import {useSettings} from '@/context/SettingsContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {cn} from '@/lib/utils';
import {ThemeToggle} from '@/components/layout/ThemeToggle';
import {useAppContext} from '@/context/AppContext';

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="text-center flex flex-col h-full">
      <CardHeader className="flex-grow">
        <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function LandingPage() {
  const {t, lang} = useTranslation();
  const {updateSettings} = useSettings();
  const {setIsPageTransitioning} = useAppContext();
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard if the app is running in standalone mode (PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      router.replace('/dashboard');
    }
  }, [router]);

  const setLanguage = (newLang: 'en' | 'id') => {
    updateSettings({language: newLang});
  };

  const handleOpenApp = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPageTransitioning(true);
    router.push('/dashboard');
  };

  const languages = {
    en: 'English',
    id: 'Bahasa Indonesia',
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <Link
            href="#"
            className="flex items-center justify-center gap-2 font-semibold"
          >
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-headline text-lg">CoinKeeper</span>
          </Link>
          <nav className="ml-auto flex items-center gap-4 sm:gap-6">
            <Button asChild>
              <Link href="/dashboard" onClick={handleOpenApp}>
                {t('open_app')} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full pt-12 md:pt-20 lg:pt-28 pb-12 md:pb-24 lg:pb-16 border-b">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-6xl">
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-16 items-center">
                <div className="flex flex-col justify-center space-y-4 text-center lg:text-left">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:leading-tighter">
                    {t('landing_title')}
                  </h1>
                  <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                    {t('landing_subtitle')}
                  </p>
                  <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center lg:justify-start">
                    <Button asChild size="lg">
                      <Link href="/dashboard" onClick={handleOpenApp}>
                        {t('landing_cta')}
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Image
                    src="/image/finance-ilustration.png"
                    width={500}
                    height={500}
                    alt="Financial Illustration"
                    className="w-full max-w-md hidden lg:block"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted/40"
        >
          <div className="container space-y-12 px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  {t('features_title')}
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  {t('features_subtitle')}
                </p>
              </div>
            </div>
            <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3">
              <FeatureCard
                icon={<ShieldCheck className="w-8 h-8" />}
                title={t('feature_privacy_title')}
                description={t('feature_privacy_desc')}
              />
              <FeatureCard
                icon={<CalendarClock className="w-8 h-8" />}
                title={t('scheduledTransactions')}
                description={t('feature_scheduled_desc')}
              />
              <FeatureCard
                icon={<Landmark className="w-8 h-8" />}
                title={t('debts')}
                description={t('feature_debt_desc')}
              />
              <FeatureCard
                icon={<PieChart className="w-8 h-8" />}
                title={t('budgets')}
                description={t('feature_budget_desc')}
              />
              <FeatureCard
                icon={<Smartphone className="w-8 h-8" />}
                title={t('feature_browser_title')}
                description={t('feature_browser_desc')}
              />
              <FeatureCard
                icon={<BarChart className="w-8 h-8" />}
                title={t('feature_reports_title')}
                description={t('feature_reports_desc')}
              />
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <div className="flex flex-col sm:flex-row items-center gap-x-2 text-xs text-muted-foreground">
          <p>&copy; 2024 CoinKeeper. All rights reserved.</p>
          <p className="hidden sm:block">|</p>
          <p>
            Made with ❤️ by{' '}
            <a
              href="https://rendzzx.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              rendzzx
            </a>
          </p>
        </div>
        <nav className="sm:ml-auto flex items-center gap-4 sm:gap-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Globe className="h-4 w-4 mr-2" />
                {languages[lang]}
                <ChevronsUpDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setLanguage('en')}>
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    lang === 'en' ? 'opacity-100' : 'opacity-0'
                  )}
                />
                English
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setLanguage('id')}>
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    lang === 'id' ? 'opacity-100' : 'opacity-0'
                  )}
                />
                Bahasa Indonesia
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </nav>
      </footer>
    </div>
  );
}
