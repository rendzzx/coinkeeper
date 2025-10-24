
"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Header } from "@/components/layout/Header";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { History as HistoryIcon, RotateCcw, Trash2, Shield, Search } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { HistoryDetailModal } from "@/components/history/HistoryDetailModal";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { HistoryLog } from "@/lib/types";
import { toast } from "@/hooks/use-toast-internal";

export default function HistoryPage() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { state, dispatch } = useAppContext();
  const { history: historyLogs } = state;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<HistoryLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleRestore = (restoreId: string) => {
    dispatch({ type: 'RESTORE_FROM_BIN', payload: restoreId });
    toast({ title: t('toastItemRestored'), description: t('toastItemRestoredDesc') });
  };

  const handlePermanentDelete = (restoreId: string) => {
    dispatch({ type: 'PERMANENT_DELETE_FROM_BIN', payload: restoreId });
    toast({ title: t('toastItemPermanentlyDeleted'), description: t('toastItemPermanentlyDeletedDesc'), variant: 'destructive' });
  };

  const handleViewDetails = (log: HistoryLog) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  const filteredLogs = historyLogs?.filter(log => {
    const searchTermLower = searchTerm.toLowerCase();
    const descriptionMatch = log.description?.toLowerCase().includes(searchTermLower);
    const entityMatch = log.entity?.toLowerCase().includes(searchTermLower);
    const actionMatch = log.action?.toLowerCase().includes(searchTermLower);
    
    return descriptionMatch || entityMatch || actionMatch;
  });

  const renderLogItem = (log: HistoryLog) => (
    <div key={log.id} className="flex flex-col sm:flex-row gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer" onClick={() => handleViewDetails(log)}>
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="capitalize">{log.entity}</Badge>
                <Badge variant="secondary" className="capitalize">{log.action}</Badge>
                 {log.context?.source === 'system' && (
                    <Badge variant="outline" className="flex items-center gap-1.5 cursor-help p-1 h-fit bg-muted/50">
                        <Shield size={12} /> System
                    </Badge>
                )}
            </div>
            <p className="text-sm font-medium">{log.description || 'No description available.'}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(log.timestamp, settings.language, settings.timeFormat)}</p>
        </div>
        {log.restoreId && log.status === 'pending' && (
             <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <RotateCcw className="h-4 w-4" /> Restore
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Restore Item?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will restore the item and any related data.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRestore(log.restoreId!)}>Restore</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2">
                            <Trash2 className="h-4 w-4" /> Delete Permanently
                        </Button>
                    </AlertDialogTrigger>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone and will permanently delete the item.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handlePermanentDelete(log.restoreId!)} className="bg-destructive hover:bg-destructive/90">Delete Permanently</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <Header title={t('history')} />
      <Card>
        <CardHeader>
          <CardTitle>{t('history')}</CardTitle>
          <CardDescription>{t('historyPageDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {filteredLogs && filteredLogs.length > 0 ? (
                <ScrollArea className="h-[60vh] border rounded-md">
                    {filteredLogs.map(renderLogItem)}
                </ScrollArea>
            ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                    <HistoryIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-semibold">No History Logs Found</h3>
                    <p className="text-muted-foreground mt-2">
                        {historyLogs && historyLogs.length > 0 ? 'Your search returned no results.' : 'Activities you perform in the app will be recorded here.'}
                    </p>
                </div>
            )}
        </CardContent>
      </Card>
      
      {selectedLog && (
        <HistoryDetailModal
          isOpen={isDetailModalOpen}
          setIsOpen={setIsDetailModalOpen}
          log={selectedLog}
        />
      )}
    </div>
  );
}
