'use client';

import { Button } from '~/components/ui/button';
import type { VehicleStatus } from '@prisma/client';

interface VehicleStatusTabsProps {
  activeStatus: VehicleStatus | 'ALL_ACTIVE';
  onStatusChange: (status: VehicleStatus | 'ALL_ACTIVE') => void;
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
 * Hides when only one filter is available (no filtering needed).
 */
export function VehicleStatusTabs({ 
  activeStatus, 
  onStatusChange,
  counts,
}: VehicleStatusTabsProps) {
  // Count how many filters have items
  const availableFilters = [
    counts && counts.total > 0,
    counts && counts.archived > 0,
  ].filter(Boolean).length;

  // Hide filters if only one or none available
  if (availableFilters <= 1) {
    return null;
  }

  return (
    <div className="flex gap-2">
      {counts && counts.total > 0 && (
        <Button
          variant={activeStatus === 'ALL_ACTIVE' ? 'default' : 'outline'}
          onClick={() => onStatusChange('ALL_ACTIVE')}
          size="sm"
        >
          Registered {`(${counts.total})`}
        </Button>
      )}
      {counts && counts.archived > 0 && (
        <Button
          variant={activeStatus === 'ARCHIVED' ? 'default' : 'outline'}
          onClick={() => onStatusChange('ARCHIVED')}
          size="sm"
        >
          Deactivated {`(${counts.archived})`}
        </Button>
      )}
    </div>
  );
}


