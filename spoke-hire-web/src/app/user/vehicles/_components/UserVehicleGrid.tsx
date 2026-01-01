'use client';

import Link from 'next/link';
import { UserVehicleCard } from './UserVehicleCard';
import { Button } from '~/components/ui/button';
import type { VehicleStatus } from '@prisma/client';

interface VehicleMedia {
  id: string;
  publishedUrl: string | null;
  originalUrl: string;
  type: string;
  altText: string | null;
}

interface Vehicle {
  id: string;
  name: string;
  year: string;
  status: VehicleStatus;
  make: {
    id: string;
    name: string;
  };
  model: {
    id: string;
    name: string;
  };
  media: VehicleMedia[];
  _count: {
    media: number;
  };
}

interface UserVehicleGridProps {
  vehicles: Vehicle[];
}

/**
 * User Vehicle Grid Component
 * 
 * Displays a responsive grid of vehicle cards for regular users.
 */
export function UserVehicleGrid({ vehicles }: UserVehicleGridProps) {
  if (vehicles.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-24 w-24 mx-auto text-slate-300 dark:text-slate-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
          No vehicles yet
        </h3>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
          You don't have any vehicles listed yet.
        </p>
        <Button asChild>
          <Link href="/user/vehicles/new">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Your First Vehicle
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {vehicles.map((vehicle) => (
        <UserVehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}

