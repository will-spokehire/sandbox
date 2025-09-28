"use client";

import { useState } from "react";
import { type VehicleData } from "~/types/vehicle";
import {
  getVehicleName,
  getMake,
  getModel,
  getYear,
  getRegistration,
  getOwnerName,
  getPrice,
  getImages,
  hasImages,
  hasContact,
  isPublished,
  getSourceBadges,
  formatPrice,
  formatVehicleName,
  getSourceColor,
  getRegistrationFilterUrl,
} from "~/lib/vehicles";
import { DataSourceBreakdown } from "./DataSourceBreakdown";
import { ImageModal } from "../ui/ImageModal";

interface VehicleDetailProps {
  vehicle: VehicleData;
}

export function VehicleDetail({ vehicle }: VehicleDetailProps) {
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    currentIndex: number;
  }>({
    isOpen: false,
    currentIndex: 0,
  });

  const name = getVehicleName(vehicle);
  const make = getMake(vehicle);
  const model = getModel(vehicle);
  const year = getYear(vehicle);
  const registration = getRegistration(vehicle);
  const owner = getOwnerName(vehicle);
  const price = getPrice(vehicle);
  const images = getImages(vehicle);
  const sources = getSourceBadges(vehicle);
  const contact = vehicle.owner;

  const openImageModal = (index: number) => {
    setImageModal({
      isOpen: true,
      currentIndex: index,
    });
  };

  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      currentIndex: 0,
    });
  };

  const changeImageIndex = (index: number) => {
    setImageModal(prev => ({
      ...prev,
      currentIndex: index,
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {formatVehicleName(vehicle)}
        </h2>
        
        {/* Source Badges */}
        <div className="flex flex-wrap gap-2 mb-2">
          {sources.map((source) => (
            <span
              key={source}
              className={`
                px-3 py-1 text-sm font-medium rounded-full
                ${getSourceColor(source)}
              `}
            >
              {source}
            </span>
          ))}
        </div>

        {/* Status */}
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
            isPublished(vehicle) 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isPublished(vehicle) ? 'Published' : 'Unpublished'}
          </span>
          <span className="text-sm text-gray-500">
            ID: {vehicle.id}
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Vehicle Details */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Vehicle Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Make:</span>
                <span className="ml-2 text-gray-900">{make}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Model:</span>
                <span className="ml-2 text-gray-900">{model}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Year:</span>
                <span className="ml-2 text-gray-900">{year || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Registration:</span>
                {registration ? (
                  <a
                    href={getRegistrationFilterUrl(registration)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                    title={`Search for vehicles with registration: ${registration}`}
                  >
                    {registration}
                    <svg className="inline-block w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <span className="ml-2 text-gray-900">N/A</span>
                )}
              </div>
              <div>
                <span className="font-medium text-gray-600">Engine:</span>
                <span className="ml-2 text-gray-900">{vehicle.vehicle.engineCapacity || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Seats:</span>
                <span className="ml-2 text-gray-900">{vehicle.vehicle.numberOfSeats || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Steering:</span>
                <span className="ml-2 text-gray-900">{vehicle.vehicle.steering || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Gearbox:</span>
                <span className="ml-2 text-gray-900">{vehicle.vehicle.gearbox || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Appearance</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Exterior Color:</span>
                <span className="ml-2 text-gray-900">{vehicle.vehicle.exteriorColour || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Interior Color:</span>
                <span className="ml-2 text-gray-900">{vehicle.vehicle.interiorColour || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Condition:</span>
                <span className="ml-2 text-gray-900">{vehicle.vehicle.condition || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Road Legal:</span>
                <span className="ml-2 text-gray-900">{vehicle.vehicle.isRoadLegal || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Pricing */}
          {price && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing</h3>
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(price)}
              </div>
            </div>
          )}

          {/* Collection */}
          {vehicle.vehicle.collection && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Collection</h3>
              <span className="text-sm text-gray-700">{vehicle.vehicle.collection}</span>
            </div>
          )}
        </div>

        {/* Right Column - Contact & Images */}
        <div className="space-y-6">
          {/* Contact Information */}
          {hasContact(vehicle) && contact && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm">
                {(contact.firstName || contact.lastName) && (
                  <div>
                    <span className="font-medium text-gray-600">Name:</span>
                    <span className="ml-2 text-gray-900">{`${contact.firstName} ${contact.lastName}`.trim()}</span>
                  </div>
                )}
                {contact.phone && (
                  <div>
                    <span className="font-medium text-gray-600">Phone:</span>
                    <span className="ml-2 text-gray-900">{contact.phone}</span>
                  </div>
                )}
                {contact.email && (
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>
                    <span className="ml-2 text-gray-900">{contact.email}</span>
                  </div>
                )}
                {contact.address && (
                  <div>
                    <span className="font-medium text-gray-600">Address:</span>
                    <span className="ml-2 text-gray-900">
                      {[
                        contact.address.street,
                        contact.address.city,
                        contact.address.county,
                        contact.address.postcode,
                        contact.address.country
                      ].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Images */}
          {hasImages(vehicle) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Images</h3>
              <div className="flex flex-wrap gap-3">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => openImageModal(index)}
                    className="relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                  >
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <img
                        src={image}
                        alt={`${name} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                    {/* Image number badge */}
                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {index + 1}
                    </div>
                    {/* Hover overlay for full view */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {images.length} image{images.length !== 1 ? 's' : ''} available
              </p>
            </div>
          )}

          {/* Description */}
          {vehicle.vehicle.description && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {vehicle.vehicle.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Data Source Breakdown */}
      <div className="mt-8">
        <DataSourceBreakdown vehicle={vehicle} />
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={closeImageModal}
        images={images}
        currentIndex={imageModal.currentIndex}
        onIndexChange={changeImageIndex}
        vehicleName={name}
      />
    </div>
  );
}
