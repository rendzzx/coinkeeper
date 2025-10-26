"use client";

import {AlertTriangle} from "lucide-react";
import {useTranslation} from "@/hooks/use-translation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {Button} from "../ui/button";

interface AutoLockWarningProps {
  isOpen: boolean;
  countdown: number;
  onStay: () => void;
}

export function AutoLockWarning({
  isOpen,
  countdown,
  onStay,
}: AutoLockWarningProps) {
  const {t} = useTranslation();

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            {t("autoLock")}
          </AlertDialogTitle>
          <AlertDialogDescription className="pt-2">
            {t("autoLockWarning", {countdown})}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={onStay} className="w-full sm:w-auto">
            {t("stayLoggedIn")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
