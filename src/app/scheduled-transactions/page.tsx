
"use client";

import { useState } from "react";
import { Plus, PlusCircle, CalendarClock, Settings2 } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { ScheduledTransactionCard } from "@/components/scheduled-transactions/ScheduledTransactionCard";
import { ScheduledTransactionForm } from "@/components/scheduled-transactions/ScheduledTransactionForm";
import type { ScheduledTransaction } from "@/lib/types";
import { useTranslation } from "@/hooks/use-translation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { WalletForm } from "@/components/wallets/WalletForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast-internal";
import { useScheduledTransaction } from "@/context/ScheduledTransactionContext";

export default function ScheduledTransactionsPage() {
  const { scheduledTransactions, processScheduledTransactions } = useScheduledTransaction();
  const { wallets } = useWallet();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduledTransaction | undefined>(undefined);
  const [isNoWalletAlertOpen, setIsNoWalletAlertOpen] = useState(false);
  const [isWalletFormOpen, setIsWalletFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const handleAddSchedule = () => {
    if (wallets.length === 0) {
      setIsNoWalletAlertOpen(true);
    } else {
      setSelectedSchedule(undefined);
      setIsFormOpen(true);
    }
  };

  const handleEditSchedule = (schedule: ScheduledTransaction) => {
    setSelectedSchedule(schedule);
    setIsFormOpen(true);
  };

  const handleWalletCreated = () => {
    setIsWalletFormOpen(false);
    setIsFormOpen(true);
    setSelectedSchedule(undefined);
  };

  const handleRunScheduler = async () => {
    toast({ title: "Running Scheduler", description: "Processing scheduled transactions..." });
    await processScheduledTransactions();
    toast({ title: "Scheduler Finished", description: "All due transactions have been processed." });
  };

  const activeSchedules = scheduledTransactions.filter(s => s.status === 'active').sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  const completedSchedules = scheduledTransactions.filter(s => s.status === 'completed').sort((a, b) => new Date(b.nextDueDate).getTime() - new Date(a.nextDueDate).getTime());

  const renderScheduleList = (schedules: ScheduledTransaction[]) => {
    if (schedules.length > 0) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schedules.map((schedule) => (
            <ScheduledTransactionCard key={schedule.id} schedule={schedule} onEdit={handleEditSchedule} />
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
          <CalendarClock className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">{t('noScheduledTransactions')}</h3>
          <p className="text-muted-foreground mt-2">{t('getStartedByCreatingScheduled')}</p>
          <Button onClick={handleAddSchedule} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> {t('createScheduledTransaction')}
          </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <Header title={t('scheduledTransactions')}>
        {settings.devMode && (
          <Button variant="outline" onClick={handleRunScheduler}>
            <Settings2 className="mr-2 h-4 w-4" />
            Run Scheduler
          </Button>
        )}
      </Header>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'completed')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">{t('active')}</TabsTrigger>
          <TabsTrigger value="completed">{t('completed')}</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          {renderScheduleList(activeSchedules)}
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          {renderScheduleList(completedSchedules)}
        </TabsContent>
      </Tabs>


      <ScheduledTransactionForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        schedule={selectedSchedule}
      />
      
      <WalletForm 
        isOpen={isWalletFormOpen} 
        setIsOpen={setIsWalletFormOpen}
        onSuccess={handleWalletCreated} 
      />

      <AlertDialog open={isNoWalletAlertOpen} onOpenChange={setIsNoWalletAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('noWalletsYet')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('getStartedByCreatingWallet')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setIsNoWalletAlertOpen(false);
              setIsWalletFormOpen(true);
            }}>
              {t('createWallet')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <Button
        onClick={handleAddSchedule}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50"
        size="icon"
      >
        <Plus className="h-8 w-8" />
        <span className="sr-only">{t('addScheduledTransaction')}</span>
      </Button>
    </div>
  );
}
