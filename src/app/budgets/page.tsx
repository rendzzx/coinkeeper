
"use client";

import { useState } from "react";
import { Plus, PlusCircle, PieChart } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { BudgetForm } from "@/components/budgets/BudgetForm";
import type { Budget } from "@/lib/types";
import { useTranslation } from "@/hooks/use-translation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetTransactionsModal } from "@/components/budgets/BudgetTransactionsModal";

export default function BudgetsPage() {
  const { state } = useAppContext();
  const { t } = useTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"periodic" | "one-time">("periodic");
  const [defaultBudgetType, setDefaultBudgetType] = useState<"periodic" | "one-time">("periodic");
  
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
  const [viewingBudget, setViewingBudget] = useState<Budget | undefined>(undefined);


  const handleAddBudget = () => {
    setSelectedBudget(undefined);
    setDefaultBudgetType(activeTab);
    setIsFormOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsFormOpen(true);
  };

  const handleViewTransactions = (budget: Budget) => {
    setViewingBudget(budget);
    setIsTransactionsModalOpen(true);
  }

  const periodicBudgets = state.budgets.filter(b => b.type === 'periodic');
  const oneTimeBudgets = state.budgets.filter(b => b.type === 'one-time');
  
  const renderBudgetList = (budgets: Budget[], type: "periodic" | "one-time") => {
    if (budgets.length > 0) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard 
              key={budget.id} 
              budget={budget} 
              onEdit={handleEditBudget} 
              onViewTransactions={handleViewTransactions}
            />
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
          <PieChart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">{t('noBudgetsSet')}</h3>
          <p className="text-muted-foreground mt-2">{t('getStartedByCreatingBudget')}</p>
          <Button onClick={handleAddBudget} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> {t('createBudget')}
          </Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      <Header title={t('budgets')} />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "periodic" | "one-time")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="periodic">{t('monthly')}</TabsTrigger>
          <TabsTrigger value="one-time">{t('one-time')}</TabsTrigger>
        </TabsList>
        <TabsContent value="periodic" className="mt-4">
            {renderBudgetList(periodicBudgets, "periodic")}
        </TabsContent>
        <TabsContent value="one-time" className="mt-4">
            {renderBudgetList(oneTimeBudgets, "one-time")}
        </TabsContent>
      </Tabs>


      <BudgetForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        budget={selectedBudget}
        defaultType={defaultBudgetType}
      />

      {viewingBudget && (
        <BudgetTransactionsModal
          isOpen={isTransactionsModalOpen}
          setIsOpen={setIsTransactionsModalOpen}
          budget={viewingBudget}
        />
      )}

       <Button
        onClick={handleAddBudget}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50"
        size="icon"
      >
        <Plus className="h-8 w-8" />
        <span className="sr-only">{t('addBudget')}</span>
      </Button>
    </div>
  );
}
