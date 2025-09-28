"use client";

import { type VehicleStats } from "~/types/vehicle";

interface StatsProps {
  stats: VehicleStats;
  isLoading?: boolean;
}

export function Stats({ stats, isLoading = false }: StatsProps) {
  const statItems = [
    {
      label: "Total Records",
      value: stats.totalRecords,
      icon: "📊",
      color: "bg-blue-500",
    },
    {
      label: "Published",
      value: stats.publishedRecords,
      icon: "✅",
      color: "bg-green-500",
    },
    {
      label: "Multi-Source",
      value: stats.multiSourceRecords,
      icon: "🔗",
      color: "bg-purple-500",
    },
    {
      label: "With Images",
      value: stats.withImages,
      icon: "🖼️",
      color: "bg-orange-500",
    },
    {
      label: "With Contact",
      value: stats.withContact,
      icon: "📞",
      color: "bg-teal-500",
    },
    {
      label: "With Address",
      value: stats.withAddress,
      icon: "📍",
      color: "bg-red-500",
    },
    {
      label: "With Registration",
      value: stats.withRegistration,
      icon: "📋",
      color: "bg-indigo-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="animate-pulse">
              <div className="h-8 w-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{item.icon}</span>
            <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
          </div>
          
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {item.value.toLocaleString()}
          </div>
          
          <div className="text-sm text-gray-600">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
