"use client";

import { type VehicleData } from "~/types/vehicle";
import {
  getVehicleName,
  getMake,
  getModel,
  getYear,
  getRegistration,
  getOwnerName,
  getStatus,
  getSourceBadges,
  getSourceColor,
  getStatusColor,
} from "~/lib/vehicles";

interface VehicleCardProps {
  vehicle: VehicleData;
  isSelected?: boolean;
  onClick: (vehicleId: string) => void;
}

export function VehicleCard({ vehicle, isSelected, onClick }: VehicleCardProps) {
  const name = getVehicleName(vehicle);
  const make = getMake(vehicle);
  const model = getModel(vehicle);
  const year = getYear(vehicle);
  const registration = getRegistration(vehicle);
  const owner = getOwnerName(vehicle);
  const status = getStatus(vehicle);
  const sources = getSourceBadges(vehicle);

  return (
    <div
      className={`
        p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-sm' 
          : 'border-gray-200 bg-white hover:border-gray-300'
        }
        ${vehicle.duplicate ? 'border-orange-300 bg-orange-50' : ''}
      `}
      onClick={() => onClick(vehicle.id)}
    >
      {/* Vehicle Name */}
      <div className="flex items-center gap-2 mb-1">
        <div className="font-semibold text-base text-gray-900">
          {name}
        </div>
        {vehicle.duplicate && (
          <span className="px-1.5 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full">
            Dup
          </span>
        )}
        {vehicle.hasDuplicates && !vehicle.duplicate && (
          <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
            {vehicle.duplicateCount}
          </span>
        )}
      </div>

      {/* Vehicle Details */}
      <div className="text-sm text-gray-600 mb-1">
        {make} {model} {year && `(${year})`}
      </div>

      {/* Registration and Owner */}
      <div className="text-xs text-gray-500 mb-2">
        {registration ? `Reg: ${registration}` : 'No registration'} |
        {owner || ' No owner'}
      </div>

      {/* Source Badges */}
      <div className="flex flex-wrap gap-1 mb-2">
        {sources.map((source) => (
          <span
            key={source}
            className={`
              px-1.5 py-0.5 text-xs font-medium rounded-full
              ${getSourceColor(source)}
            `}
          >
            {source}
          </span>
        ))}
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <span
          className={`
            px-1.5 py-0.5 text-xs font-medium rounded-full
            ${getStatusColor(status)}
          `}
        >
          {status}
        </span>
        
        {/* Vehicle ID */}
        <span className="text-xs text-gray-400">
          ID: {vehicle.id}
        </span>
      </div>
    </div>
  );
}
