

import type { NavItem, DashboardCardSetting } from './types';

export const ALL_NAV_ITEMS: NavItem[] = [
    { id: "nav-1", href: "/dashboard", label: "dashboard", icon: "LayoutDashboard" },
    { id: "nav-2", href: "/wallets", label: "wallets", icon: "Wallet" },
    { id: "nav-3", href: "/transactions", label: "transactions", icon: "ArrowRightLeft" },
    { id: "nav-6", href: "/scheduled-transactions", label: "scheduled", icon: "CalendarClock" },
    { id: "nav-7", href: "/debts", label: "debts", icon: "Landmark" },
    { id: "nav-4", href: "/budgets", label: "budgets", icon: "PieChart" },
    { id: "nav-5", href: "/reports", label: "reports", icon: "BarChart3" },
];

export const ALL_DASHBOARD_CARDS: DashboardCardSetting[] = [
    { id: "totalBalance", label: "dashboard_totalBalance_label" },
    { id: "income", label: "dashboard_income_label" },
    { id: "expenses", label: "dashboard_expenses_label" },
    { id: "netIncome", label: "dashboard_netIncome_label" },
    { id: "incomeExpenseChart", label: "dashboard_incomeExpenseChart_label" },
    { id: "expenseDistributionChart", label: "dashboard_expenseDistributionChart_label" },
    { id: "recentTransactions", label: "dashboard_recentTransactions_label" }
];
