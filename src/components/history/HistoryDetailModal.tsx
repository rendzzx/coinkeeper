
"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { HistoryLog } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type HistoryDetailModalProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  log: HistoryLog;
};

function DiffViewer({ title, data }: { title: string, data: any }) {
    if (!data || Object.keys(data).length === 0) {
        return null;
    }
    return (
        <div>
            <h3 className="font-semibold mb-2">{title}</h3>
            <pre className="bg-muted text-muted-foreground p-3 rounded-md text-xs overflow-auto">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    )
}

export function HistoryDetailModal({ isOpen, setIsOpen, log }: HistoryDetailModalProps) {
  const isMobile = useIsMobile();
  
  const content = (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="capitalize">{log.entity}</Badge>
        <Badge variant="secondary" className="capitalize">{log.action}</Badge>
      </div>
      <p>{log.description}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DiffViewer title="Old Value" data={log.oldValue} />
        <DiffViewer title="New Value" data={log.newValue} />
      </div>
      
      <DiffViewer title="Changes Detected" data={log.changes} />
    </div>
  );

  const title = `Log Details: ${log.id.substring(0,8)}`;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="overflow-y-auto max-h-[70vh] px-4 pb-4">
            {content}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
            <div className="py-4">
                {content}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
