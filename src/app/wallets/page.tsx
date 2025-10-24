
"use client";

import { useState } from "react";
import { Plus, PlusCircle, Wallet as WalletIcon } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { WalletCard } from "@/components/wallets/WalletCard";
import { WalletForm } from "@/components/wallets/WalletForm";
import type { Wallet } from "@/lib/types";
import { useTranslation } from "@/hooks/use-translation";

export default function WalletsPage() {
  const { wallets } = useWallet();
  const { t } = useTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | undefined>(undefined);

  const handleAddWallet = () => {
    setSelectedWallet(undefined);
    setIsFormOpen(true);
  };

  const handleEditWallet = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setIsFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      <Header title={t('wallets')} />

      {wallets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wallets.map((wallet) => (
            <WalletCard key={wallet.id} wallet={wallet} onEdit={handleEditWallet} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
          <WalletIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">{t('noWalletsYet')}</h3>
          <p className="text-muted-foreground mt-2">{t('getStartedByCreatingWallet')}</p>
          <Button onClick={handleAddWallet} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> {t('createWallet')}
          </Button>
        </div>
      )}


      <WalletForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        wallet={selectedWallet}
      />

      <Button
        onClick={handleAddWallet}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50"
        size="icon"
      >
        <Plus className="h-8 w-8" />
        <span className="sr-only">{t('addWallet')}</span>
      </Button>
    </div>
  );
}
