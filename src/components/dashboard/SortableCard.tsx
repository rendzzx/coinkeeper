
"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '../ui/card';

type SortableCardProps = {
  id: string;
  isEditMode: boolean;
  children: React.ReactNode;
  className?: string;
};

export function SortableCard({ id, isEditMode, children, className }: SortableCardProps) {
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
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative flex items-stretch", isDragging && "opacity-75", className)}
    >
      {isEditMode && (
        <div {...attributes} {...listeners} className="flex items-center justify-center cursor-grab p-2 touch-none">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 flex w-full">
        {children}
      </div>
    </div>
  );
}
