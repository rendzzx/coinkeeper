
"use client";

import React, { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as LucideIcons from 'lucide-react';
import { GripVertical } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { useSettings } from "@/context/SettingsContext";
import { TranslationKey } from "@/lib/i18n";
import type { NavItem } from "@/lib/types";
import { ALL_NAV_ITEMS } from "@/lib/config-data";

function SortableItem({ item }: { item: NavItem }) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const Icon = (LucideIcons[item.icon as keyof typeof LucideIcons] as React.ElementType) || LucideIcons.HelpCircle;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center p-3 rounded-lg border bg-background transition-shadow touch-none">
        <GripVertical className="h-5 w-5 mr-3 text-muted-foreground cursor-grab" />
        <Icon className="h-5 w-5 mr-3 text-muted-foreground" />
        <span className="font-medium">{t(item.label as TranslationKey)}</span>
    </div>
  );
}

export function SidebarSettings() {
    const { t } = useTranslation();
    const { settings, updateSettings } = useSettings();
    const { navItemOrder } = settings;
    const sensors = useSensors(
        useSensor(PointerSensor)
    );

    const orderedNavItems = useMemo(() => 
        navItemOrder
            .map(id => ALL_NAV_ITEMS.find(item => item.id === id))
            .filter((item): item is NavItem => !!item),
        [navItemOrder]
    );

    function handleDragEnd(event: DragEndEvent) {
        const {active, over} = event;
        
        if (over && active.id !== over.id) {
            const oldIndex = navItemOrder.indexOf(active.id as string);
            const newIndex = navItemOrder.indexOf(over.id as string);
            const newOrder = arrayMove(navItemOrder, oldIndex, newIndex);
            updateSettings({ navItemOrder: newOrder });
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('sidebar')} {t('settings')}</CardTitle>
                <CardDescription>
                    {t('dragAndDropSidebar')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext 
                        items={navItemOrder}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-2">
                            {orderedNavItems.map(item => <SortableItem key={item.id} item={item} />)}
                        </div>
                    </SortableContext>
                </DndContext>
            </CardContent>
        </Card>
    );
}
