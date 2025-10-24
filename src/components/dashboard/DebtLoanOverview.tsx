"use client";

import {useMemo} from "react";
import Link from "next/link";
import {Landmark, PlusCircle, ArrowUpRight, ArrowDownLeft} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {useAppContext} from "@/context/AppContext";
import {useSettings} from "@/context/SettingsContext";
import {useTranslation} from "@/hooks/use-translation";
import {formatCurrency} from "@/lib/utils";

export function DebtLoanOverview() {
  const {state} = useAppContext();
  const {settings} = useSettings();
  const {t} = useTranslation();
  const {debts} = state;
  const {currency, hideAmounts, numberFormat, decimalPlaces} = settings;

  const {totalDebt, totalLoan} = useMemo(() => {
    const activeDebts = debts.filter((d) => d.status === "active");

    const totalDebt = activeDebts
      .filter((d) => d.type === "debt")
      .reduce((sum, d) => sum + (d.initialAmount - d.paidAmount), 0);

    const totalLoan = activeDebts
      .filter((d) => d.type === "loan")
      .reduce((sum, d) => sum + (d.initialAmount - d.paidAmount), 0);

    return {totalDebt, totalLoan};
  }, [debts]);

  const hasActiveDebtsOrLoans = totalDebt > 0 || totalLoan > 0;

  if (!hasActiveDebtsOrLoans) {
    return (
      <Card className="flex flex-col flex-1 w-full items-center justify-center text-center p-8">
        <CardHeader>
          <CardTitle>{t("dashboard_debtLoanOverview_label")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("noActiveDebtsOrLoans")}</p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/debts">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("addDebt")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col flex-1 w-full">
      <CardHeader>
        <CardTitle>{t("dashboard_debtLoanOverview_label")}</CardTitle>
        <CardDescription>{t("activeDebtsAndLoans")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-600">
              {t("totalYouOwe")}
            </span>
          </div>
          <span className="font-semibold text-red-600">
            {formatCurrency(
              totalDebt,
              currency,
              hideAmounts,
              numberFormat,
              decimalPlaces
            )}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-600">
              {t("totalOwedToYou")}
            </span>
          </div>
          <span className="font-semibold text-green-600">
            {formatCurrency(
              totalLoan,
              currency,
              hideAmounts,
              numberFormat,
              decimalPlaces
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
