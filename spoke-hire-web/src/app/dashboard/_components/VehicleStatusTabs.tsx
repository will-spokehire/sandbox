'use client';

import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import type { VehicleStatus } from '@prisma/client';

interface VehicleStatusTabsProps {
  activeStatus: VehicleStatus | 'ALL';
  onStatusChange: (status: VehicleStatus | 'ALL') => void;
  counts?: {
    total: number;
    published: number;
    draft: number;
    declined: number;
    archived: number;
  };
}

/**
 * Vehicle Status Tabs Component
 * 
 * Allows users to filter their vehicles by status.
 */
export function VehicleStatusTabs({ 
  activeStatus, 
  onStatusChange,
  counts,
}: VehicleStatusTabsProps) {
  return (
    <Tabs value={activeStatus} onValueChange={(value) => onStatusChange(value as VehicleStatus | 'ALL')}>
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="ALL" className="flex-1 sm:flex-none">
          All {counts && `(${counts.total})`}
        </TabsTrigger>
        <TabsTrigger value="PUBLISHED" className="flex-1 sm:flex-none">
          Published {counts && `(${counts.published})`}
        </TabsTrigger>
        <TabsTrigger value="DRAFT" className="flex-1 sm:flex-none">
          Draft {counts && `(${counts.draft})`}
        </TabsTrigger>
        <TabsTrigger value="DECLINED" className="flex-1 sm:flex-none">
          Declined {counts && `(${counts.declined})`}
        </TabsTrigger>
        <TabsTrigger value="ARCHIVED" className="flex-1 sm:flex-none">
          Deactivated {counts && `(${counts.archived})`}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

