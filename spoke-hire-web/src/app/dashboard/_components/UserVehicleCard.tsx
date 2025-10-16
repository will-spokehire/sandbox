'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';
import type { VehicleStatus } from '@prisma/client';

interface VehicleMedia {
  id: string;
  publishedUrl: string | null;
  originalUrl: string;
  type: string;
  altText: string | null;
}

interface UserVehicleCardProps {
  vehicle: {
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
  };
}

const statusColors: Record<VehicleStatus, string> = {
  PUBLISHED: 'bg-green-500',
  DRAFT: 'bg-yellow-500',
  DECLINED: 'bg-red-500',
  ARCHIVED: 'bg-gray-500',
};

const statusLabels: Record<VehicleStatus, string> = {
  PUBLISHED: 'Published',
  DRAFT: 'Draft',
  DECLINED: 'Declined',
  ARCHIVED: 'Archived',
};

/**
 * User Vehicle Card Component
 * 
 * Displays a vehicle card for regular users (non-admin).
 * Shows primary image, name, make/model, year, and status.
 */
export function UserVehicleCard({ vehicle }: UserVehicleCardProps) {
  const primaryImage = vehicle.media[0];
  const imageUrl = primaryImage?.publishedUrl || primaryImage?.originalUrl;

  return (
    <Link href={`/dashboard/${vehicle.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer p-0 gap-0">
        <div className="relative aspect-[3/2] bg-slate-100 dark:bg-slate-800">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={primaryImage?.altText || vehicle.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <Badge 
              className={`${statusColors[vehicle.status]} text-white border-none`}
            >
              {statusLabels[vehicle.status]}
            </Badge>
          </div>

          {/* Image Count */}
          {vehicle._count.media > 0 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {vehicle._count.media} {vehicle._count.media === 1 ? 'photo' : 'photos'}
            </div>
          )}
        </div>

        <div className="p-4 pt-3">
          <h3 className="font-semibold text-lg mb-1 text-slate-900 dark:text-slate-50 truncate">
            {vehicle.name}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            {vehicle.make.name} {vehicle.model.name}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            {vehicle.year}
          </p>
        </div>
      </Card>
    </Link>
  );
}

