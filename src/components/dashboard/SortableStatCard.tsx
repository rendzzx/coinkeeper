"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { StatCard } from './StatCard';
import { cn } from '@/lib/utils';

type SortableStatCardProps = React.ComponentProps<typeof StatCard> & {
  id: string;
  isEditMode: boolean;
};

export function SortableStatCard({ id, isEditMode, ...props }: SortableStatCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn("relative", isDragging && "opacity-75")}>
      <StatCard {...props} isEditMode={isEditMode}>
        {isEditMode && (
          <button {...attributes} {...listeners} className="cursor-grab p-1">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </StatCard>
    </div>
  );
}
