
"use client";

import { Landmark, CreditCard, Wallet as WalletIcon, MoreHorizontal, Trash2, Edit, HelpCircle } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { Wallet, WalletType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/context/AppContext";
import { useSettings } from "@/context/SettingsContext";
import { useWallet } from "@/context/WalletContext";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import React from "react";

type WalletCardProps = {
  wallet: Wallet;
  onEdit: (wallet: Wallet) => void;
};

export function WalletCard({ wallet, onEdit }: WalletCardProps) {
  const { settings } = useSettings();
  const { walletTypes } = useWallet();
  const { t } = useTranslation();
  const { currency, hideAmounts, numberFormat, decimalPlaces } = settings;

  const walletType = walletTypes.find(wt => wt.id === wallet.typeId);
  
  const Icon = walletType ? (LucideIcons[walletType.icon as keyof typeof LucideIcons] as React.ElementType) || HelpCircle : HelpCircle;

  return (
    <div onClick={() => onEdit(wallet)} className="cursor-pointer">
      <Card className="flex flex-col h-full hover:bg-muted/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{wallet.name}</CardTitle>
          <div className="flex items-center gap-2">
             <div className="w-4 h-4 rounded-full" style={{ backgroundColor: wallet.color }} />
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-end">
          <div className="text-2xl font-bold font-headline">
            {formatCurrency(wallet.balance, currency, hideAmounts, numberFormat, decimalPlaces)}
          </div>
          <p className="text-xs text-muted-foreground capitalize">{walletType?.name || t('unknown')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
