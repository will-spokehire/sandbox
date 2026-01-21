"use client";

import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { User, Mail, Phone, MapPin, Building2, Map, Navigation, Pencil } from "lucide-react";
import { formatPhoneForDisplay } from "~/lib/whatsapp";

interface ProfileData {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  street?: string | null;
  city?: string | null;
  county?: string | null;
  postcode?: string | null;
  countryName?: string | null;
}

interface ProfilePreviewProps {
  profile: ProfileData;
  onEditClick: () => void;
}

/**
 * Profile Preview Component
 * 
 * Read-only display of user profile information
 * Shows personal details, contact info, and address
 * Displays without card container to match vehicle registration page styling
 */
export function ProfilePreview({ profile, onEditClick }: ProfilePreviewProps) {
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || "Not provided";
  const hasAddress = profile.street || profile.city || profile.county || profile.postcode || profile.countryName;

  const details = [
    {
      icon: User,
      label: "Name",
      value: fullName,
    },
    {
      icon: Mail,
      label: "Email",
      value: profile.email ?? "Not provided",
      link: profile.email ? `mailto:${profile.email}` : undefined,
    },
    {
      icon: Phone,
      label: "Phone",
      value: profile.phone ? formatPhoneForDisplay(profile.phone) : "Not provided",
      link: profile.phone ? `tel:${profile.phone}` : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Edit Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onEditClick}
          className="gap-2"
        >
          <Pencil className="h-4 w-4" />
          <span className="hidden sm:inline">Edit Profile</span>
        </Button>
      </div>

      {/* Personal Details */}
      <dl className="space-y-3">
        {details.map((detail) => {
          const Icon = detail.icon;
          return (
            <div key={detail.label} className="flex items-start gap-3">
              <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <dt className="body-xs text-muted-foreground mb-0.5">
                  {detail.label}
                </dt>
                <dd className="text-sm">
                  {detail.link ? (
                    <a
                      href={detail.link}
                      className="text-primary hover:underline"
                    >
                      {detail.value}
                    </a>
                  ) : (
                    <span className="text-foreground">{detail.value}</span>
                  )}
                </dd>
              </div>
            </div>
          );
        })}
      </dl>

      {/* Address Section */}
      {hasAddress && (
        <>
          <Separator />
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1 min-w-0">
              <dt className="body-xs text-muted-foreground mb-0.5">Address</dt>
              <dd className="text-sm text-foreground space-y-1">
                {profile.street && (
                  <div className="flex items-start gap-2">
                    <Navigation className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span>{profile.street}</span>
                  </div>
                )}
                {profile.city && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span>{profile.city}</span>
                  </div>
                )}
                {profile.county && (
                  <div className="flex items-start gap-2">
                    <Map className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span>{profile.county}</span>
                  </div>
                )}
                {profile.postcode && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span>{profile.postcode}</span>
                  </div>
                )}
                {profile.countryName && (
                  <div className="flex items-start gap-2">
                    <Map className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span>{profile.countryName}</span>
                  </div>
                )}
              </dd>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

