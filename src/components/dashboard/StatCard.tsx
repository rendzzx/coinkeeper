import type { ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from '@/lib/utils';

type StatCardProps = {
  title: string;
  value: string;
  icon: ReactNode;
  description?: string;
  href?: string;
  isEditMode?: boolean;
  children?: ReactNode;
};

export function StatCard({ title, value, icon, description, href, isEditMode, children }: StatCardProps) {
  const cardContent = (
    <Card className={cn("transition-colors flex flex-col flex-1 w-full", href && !isEditMode && "hover:bg-muted/50")}>
       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {icon}
          {children}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-2xl font-bold font-headline">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
  
  if (href && !isEditMode) {
    return (
      <Link href={href} className="flex h-full w-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
