"use client";

import {useMemo, useState} from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ArrowDown,
  ArrowUp,
  DollarSign,
  Pencil,
  Wallet,
  Check,
  GripVertical,
} from "lucide-react";
import {useAppContext} from "@/context/AppContext";
import {useSettings} from "@/context/SettingsContext";
import {useTransaction} from "@/context/TransactionContext";
import {useWallet} from "@/context/WalletContext";
import {formatCurrency, cn} from "@/lib/utils";
import {Header} from "@/components/layout/Header";
import {StatCard} from "@/components/dashboard/StatCard";
import {IncomeExpenseChart} from "@/components/dashboard/IncomeExpenseChart";
import {ExpenseDistributionChart} from "@/components/dashboard/ExpenseDistributionChart";
import {RecentTransactions} from "@/components/dashboard/RecentTransactions";
import {useTranslation} from "@/hooks/use-translation";
import {Button} from "@/components/ui/button";
import {SortableCard} from "@/components/dashboard/SortableCard";
import type {DashboardCardKey} from "@/lib/types";
import {ALL_DASHBOARD_CARDS} from "@/lib/config-data";
import {BudgetOverview} from "@/components/dashboard/BudgetOverview";
import {DebtLoanOverview} from "@/components/dashboard/DebtLoanOverview";

export default function DashboardPage() {
  const {transactions} = useTransaction();
  const {wallets} = useWallet();
  const {t} = useTranslation();
  const {settings, updateSettings} = useSettings();
  const {
    dashboardCardVisibility,
    currency,
    hideAmounts,
    numberFormat,
    decimalPlaces,
    navItemOrder,
  } = settings;
  const [isEditMode, setIsEditMode] = useState(false);

  const [cardOrder, setCardOrder] = useState<DashboardCardKey[]>(
    () => settings.dashboardCardOrder || ALL_DASHBOARD_CARDS.map((c) => c.id)
  );

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthTransactions = transactions.filter(
      (t) =>
        new Date(t.date).getMonth() === now.getMonth() &&
        new Date(t.date).getFullYear() === now.getFullYear()
    );

    const totalIncome = currentMonthTransactions
      .filter((t) => t.type === "income" && !t.transferId)
      .reduce((acc, t) => acc + t.amount, 0);

    const totalExpense = currentMonthTransactions
      .filter((t) => t.type === "expense" && !t.transferId)
      .reduce((acc, t) => acc + t.amount, 0);

    const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

    return {totalIncome, totalExpense, totalBalance};
  }, [transactions, wallets]);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    if (over && active.id !== over.id) {
      const oldIndex = cardOrder.findIndex((id) => id === active.id);
      const newIndex = cardOrder.findIndex((id) => id === over.id);
      const newOrder = arrayMove(cardOrder, oldIndex, newIndex);
      setCardOrder(newOrder);
      updateSettings({dashboardCardOrder: newOrder});
    }
  };

  const visibleCards = cardOrder.filter((id) => dashboardCardVisibility[id]);

  const renderCard = (cardId: DashboardCardKey) => {
    switch (cardId) {
      case "totalBalance":
        return (
          <StatCard
            title={t("totalBalance")}
            value={formatCurrency(
              stats.totalBalance,
              currency,
              hideAmounts,
              numberFormat,
              decimalPlaces
            )}
            icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
            href="/wallets"
            isEditMode={isEditMode}
          />
        );
      case "income":
        return (
          <StatCard
            title={t("income")}
            value={formatCurrency(
              stats.totalIncome,
              currency,
              hideAmounts,
              numberFormat,
              decimalPlaces
            )}
            icon={<ArrowUp className="h-4 w-4 text-green-500" />}
            description={t("thisMonth")}
            href="/transactions?type=income"
            isEditMode={isEditMode}
          />
        );
      case "expenses":
        return (
          <StatCard
            title={t("expenses")}
            value={formatCurrency(
              stats.totalExpense,
              currency,
              hideAmounts,
              numberFormat,
              decimalPlaces
            )}
            icon={<ArrowDown className="h-4 w-4 text-red-500" />}
            description={t("thisMonth")}
            href="/transactions?type=expense"
            isEditMode={isEditMode}
          />
        );
      case "netIncome":
        return (
          <StatCard
            title={t("netIncome")}
            value={formatCurrency(
              stats.totalIncome - stats.totalExpense,
              currency,
              hideAmounts,
              numberFormat,
              decimalPlaces
            )}
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            description={t("thisMonth")}
            href="/reports"
            isEditMode={isEditMode}
          />
        );
      case "incomeExpenseChart":
        return <IncomeExpenseChart />;
      case "expenseDistributionChart":
        return <ExpenseDistributionChart />;
      case "recentTransactions":
        return <RecentTransactions />;
      case "budgetOverview":
        return <BudgetOverview />;
      case "debtLoanOverview":
        return <DebtLoanOverview />;
      default:
        return null;
    }
  };

  const getCardGridClass = (cardId: DashboardCardKey) => {
    switch (cardId) {
      case "incomeExpenseChart":
        return "lg:col-span-5";
      case "expenseDistributionChart":
        return "lg:col-span-3";
      case "recentTransactions":
        return "lg:col-span-8";
      case "budgetOverview":
        return "lg:col-span-4";
      case "debtLoanOverview":
        return "lg:col-span-4";
      case "totalBalance":
      case "income":
      case "expenses":
      case "netIncome":
        return "lg:col-span-2";
      default:
        return "lg:col-span-2";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Header title={t("dashboard")}>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsEditMode(!isEditMode)}
        >
          {isEditMode ? (
            <Check className="h-4 w-4" />
          ) : (
            <Pencil className="h-4 w-4" />
          )}
        </Button>
      </Header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visibleCards} strategy={rectSortingStrategy}>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-8">
            {visibleCards.map((cardId) => (
              <SortableCard
                key={cardId}
                id={cardId}
                isEditMode={isEditMode}
                className={getCardGridClass(cardId)}
              >
                {renderCard(cardId)}
              </SortableCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
