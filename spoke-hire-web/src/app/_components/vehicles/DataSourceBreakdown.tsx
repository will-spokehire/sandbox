"use client";

import { useState } from "react";
import { type VehicleData } from "~/types/vehicle";
import { RawDataModal } from "../ui/RawDataModal";

interface DataSourceBreakdownProps {
  vehicle: VehicleData;
}

interface DataSource {
  name: string;
  icon: string;
  data: any;
  timestamp?: string;
}

export function DataSourceBreakdown({ vehicle }: DataSourceBreakdownProps) {
  const [expandedSources, setExpandedSources] = useState<string[]>([]);
  const [rawDataModal, setRawDataModal] = useState<{
    isOpen: boolean;
    title: string;
    data: any;
  }>({
    isOpen: false,
    title: "",
    data: null,
  });

  const toggleSource = (sourceName: string) => {
    setExpandedSources(prev => 
      prev.includes(sourceName) 
        ? prev.filter(s => s !== sourceName)
        : [...prev, sourceName]
    );
  };

  // Extract data sources from the vehicle
  const dataSources: DataSource[] = [];

  // Website Catalog Data
  if (vehicle.catalogData) {
    dataSources.push({
      name: "Website Catalog",
      icon: "🏪",
      data: vehicle.catalogData,
    });
  }

  // Cleansed Data
  if (vehicle.cleansedData) {
    dataSources.push({
      name: "Cleansed Data",
      icon: "🔧",
      data: vehicle.cleansedData,
      timestamp: vehicle.cleansedData.processedAt || vehicle.cleansedData.timestamp,
    });
  }

  // User Submission Data
  if (vehicle.submissionData) {
    dataSources.push({
      name: "User Submission",
      icon: "📝",
      data: vehicle.submissionData,
    });
  }

  // If no specific source data, show the main vehicle data
  if (dataSources.length === 0) {
    dataSources.push({
      name: "Vehicle Data",
      icon: "🚗",
      data: vehicle.vehicle,
    });
  }

  const formatValue = (value: any, fieldKey?: string): string => {
    if (value === null || value === undefined || value === "") {
      return "Not provided";
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (Array.isArray(value)) {
      return value.length.toString();
    }
    
    // Special formatting for HTML content in Website Catalog details
    if (fieldKey === 'additionalInfoDescription1') {
      // Strip HTML tags and clean up the content
      const cleanText = String(value)
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
        .replace(/&amp;/g, '&') // Replace &amp; with &
        .replace(/&lt;/g, '<') // Replace &lt; with <
        .replace(/&gt;/g, '>') // Replace &gt; with >
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
      return cleanText || "Not provided";
    }
    
    // Special formatting for owner name in cleansed data
    if (fieldKey === 'owner.firstName') {
      const lastName = getFieldValue(vehicle.cleansedData, 'owner.lastName');
      if (lastName && lastName !== value) {
        return `${value} ${lastName}`;
      }
    }
    
    // Special formatting for owner name in submission data
    if (fieldKey === 'first_name_1') {
      const lastName = getFieldValue(vehicle.submissionData, 'last_name_b545');
      if (lastName && lastName !== value) {
        return `${value} ${lastName}`;
      }
    }
    
    // Special formatting for submission time
    if (fieldKey === 'submissionTime') {
      try {
        const date = new Date(value);
        return date.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch {
        return String(value);
      }
    }
    
    // Special formatting for color values (remove hex codes)
    if (fieldKey === 'productOptionDescription5' && typeof value === 'string') {
      return value.replace(/^#[a-fA-F0-9]{6}:/, ''); // Remove hex color code prefix
    }
    
    return String(value);
  };

  const getFieldValue = (data: any, field: string): any => {
    // Handle nested objects
    if (field.includes('.')) {
      const parts = field.split('.');
      let value = data;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) break;
      }
      return value;
    }
    return data?.[field];
  };

  const getFieldsForSource = (sourceName: string) => {
    const baseFields = [
      { key: 'make', label: 'Make' },
      { key: 'model', label: 'Model' },
      { key: 'year', label: 'Year' },
      { key: 'registration', label: 'Registration' },
      { key: 'engineCapacity', label: 'Engine Capacity' },
      { key: 'numberOfSeats', label: 'Number of Seats' },
      { key: 'steering', label: 'Steering' },
      { key: 'gearbox', label: 'Gearbox' },
      { key: 'exteriorColour', label: 'Exterior Color' },
      { key: 'interiorColour', label: 'Interior Color' },
      { key: 'condition', label: 'Condition' },
      { key: 'owner.firstName', label: 'Owner Name' },
      { key: 'owner.email', label: 'Owner Email' },
      { key: 'owner.phone', label: 'Owner Phone' },
      { key: 'images.urls', label: 'Images' },
    ];

    // Map Website Catalog data fields
    if (sourceName === "Website Catalog") {
      return [
        { key: 'name', label: 'Vehicle Name' },
        { key: 'brand', label: 'Brand' },
        { key: 'productOptionDescription1', label: 'Make' },
        { key: 'productOptionDescription2', label: 'Decade' },
        { key: 'productOptionDescription3', label: 'Steering' },
        { key: 'productOptionDescription4', label: 'Gearbox' },
        { key: 'productOptionDescription5', label: 'Exterior Color' },
        { key: 'productOptionDescription6', label: 'Number of Seats' },
        { key: 'price', label: 'Price' },
        { key: 'collection', label: 'Collection' },
        { key: 'visible', label: 'Visible' },
        { key: 'inventory', label: 'Inventory Status' },
        { key: 'processed.images.count', label: 'Images' },
        { key: 'additionalInfoDescription1', label: 'Details' },
      ];
    }

    // Map cleansed data fields
    if (sourceName === "Cleansed Data") {
      return [
        { key: 'vehicle.make', label: 'Make' },
        { key: 'vehicle.model', label: 'Model' },
        { key: 'vehicle.yearOfManufacture', label: 'Year' },
        { key: 'vehicle.registration', label: 'Registration' },
        { key: 'vehicle.engineCapacity', label: 'Engine Capacity' },
        { key: 'vehicle.numberOfSeats', label: 'Number of Seats' },
        { key: 'vehicle.steering', label: 'Steering' },
        { key: 'vehicle.gearbox', label: 'Gearbox' },
        { key: 'vehicle.exteriorColour', label: 'Exterior Color' },
        { key: 'vehicle.interiorColour', label: 'Interior Color' },
        { key: 'vehicle.condition', label: 'Condition' },
        { key: 'vehicle.isRoadLegal', label: 'Road Legal' },
        { key: 'owner.firstName', label: 'Owner Name' },
        { key: 'owner.email', label: 'Owner Email' },
        { key: 'owner.phone', label: 'Owner Phone' },
        { key: 'images.count', label: 'Images' },
        { key: 'submissionTime', label: 'Processed Date' },
      ];
    }

    // Map submission data fields to standard fields
    if (sourceName === "User Submission") {
      return [
        { key: 'make_1', label: 'Make' },
        { key: 'model', label: 'Model' },
        { key: 'year_of_manufacture_1', label: 'Year' },
        { key: 'registration', label: 'Registration' },
        { key: 'engine_capacity', label: 'Engine Capacity' },
        { key: 'number_of_seats_1', label: 'Number of Seats' },
        { key: 'steering_1', label: 'Steering' },
        { key: 'gearbox_1', label: 'Gearbox' },
        { key: 'exterior_colour_1', label: 'Exterior Color' },
        { key: 'interior_colour_1', label: 'Interior Color' },
        { key: 'condition', label: 'Condition' },
        { key: 'first_name_1', label: 'Owner Name' },
        { key: 'email_4bec', label: 'Owner Email' },
        { key: 'phone', label: 'Owner Phone' },
        { key: 'upload_vehicle_images', label: 'Images' },
      ];
    }

    return baseFields;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📊</span>
        <h3 className="text-lg font-semibold text-gray-900">Data Source Breakdown</h3>
      </div>

      {dataSources.map((source, index) => {
        const isExpanded = expandedSources.includes(source.name);
        
        return (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Source Header */}
            <button
              onClick={() => toggleSource(source.name)}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{source.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-900">{source.name}</h4>
                  {source.timestamp && (
                    <p className="text-sm text-gray-500">{source.timestamp}</p>
                  )}
                </div>
              </div>
              <svg
                className={`h-5 w-5 text-gray-500 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Source Data */}
            {isExpanded && (
              <div className="p-4 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getFieldsForSource(source.name).map((field) => {
                    const value = getFieldValue(source.data, field.key);
                    const formattedValue = formatValue(value, field.key);
                    
                    return (
                      <div key={field.key} className="flex flex-col">
                        <span className="text-sm font-medium text-gray-600 mb-1">
                          {field.label}
                        </span>
                        <span className={`text-sm ${
                          formattedValue === "Not provided" 
                            ? "text-gray-400 italic" 
                            : "text-gray-900"
                        }`}>
                          {formattedValue}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Show Raw Data Button */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setRawDataModal({
                        isOpen: true,
                        title: `${source.name} Raw Data`,
                        data: source.data,
                      });
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Show Raw Data
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Raw Data Modal */}
      <RawDataModal
        isOpen={rawDataModal.isOpen}
        onClose={() => setRawDataModal({ isOpen: false, title: "", data: null })}
        title={rawDataModal.title}
        data={rawDataModal.data}
      />
    </div>
  );
}
