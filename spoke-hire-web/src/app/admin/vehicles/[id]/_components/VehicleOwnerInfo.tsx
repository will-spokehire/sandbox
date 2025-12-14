"use client";

import { Mail, Phone, User, MapPin, Car, MessageCircle, Shield, Copy } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";
import { formatOwnerName, getInitials } from "~/lib/vehicles";
import { formatPhoneForDisplay } from "~/lib/whatsapp";
import { type VehicleDetail } from "~/types/vehicle";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { openWhatsAppChat } from "~/lib/whatsapp";

interface VehicleOwnerInfoProps {
  owner: VehicleDetail["owner"];
  vehicleId: string;
}

/**
 * Format date for display
 */
function formatAcceptanceDate(date: Date | string | null): string {
  if (!date) return "Not provided";
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Vehicle Owner Information Card
 * 
 * Displays owner contact details and account information
 */
export function VehicleOwnerInfo({ owner, vehicleId }: VehicleOwnerInfoProps) {
  const ownerName = formatOwnerName(owner.firstName, owner.lastName, owner.email);
  const initials = getInitials(owner.firstName, owner.lastName);

  // Fetch other vehicles by this owner
  const { data: ownerVehicles } = api.vehicle.list.useQuery(
    {
      ownerId: owner.id,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes cache
    }
  );

  // Filter out the current vehicle and limit to 5
  const otherVehicles = (ownerVehicles?.vehicles as Array<{ id: string; name: string; make?: { name: string }; model?: { name: string }; year: number; status: string }> | undefined)
    ?.filter((v) => v.id !== vehicleId)
    .slice(0, 5) ?? [];

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error(`Failed to copy ${label}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <span>Owner Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Owner Header with Avatar */}
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {ownerName}
            </h3>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {owner.userType}
              </Badge>
              <Badge
                variant={owner.status === "ACTIVE" ? "default" : "secondary"}
                className="text-xs"
              >
                {owner.status}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Contact Details */}
        <dl className="space-y-3">
          {/* Email */}
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1 min-w-0">
              <dt className="text-xs text-muted-foreground mb-0.5">Email</dt>
              <dd className="text-sm">
                <a
                  href={`mailto:${owner.email}`}
                  className="text-primary hover:underline truncate block"
                >
                  {owner.email}
                </a>
              </dd>
            </div>
          </div>

          {/* Phone */}
          {owner.phone && (
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <dt className="text-xs text-muted-foreground mb-0.5">Phone</dt>
                <dd className="text-sm">
                  <a
                    href={`tel:${owner.phone}`}
                    className="text-primary hover:underline"
                  >
                    {formatPhoneForDisplay(owner.phone)}
                  </a>
                </dd>
              </div>
            </div>
          )}

          {/* Address */}
          {(owner.street ?? owner.city ?? owner.county ?? owner.postcode ?? owner.country) && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <dt className="text-xs text-muted-foreground mb-0.5">Address</dt>
                <dd className="text-sm text-foreground">
                  {owner.street && <div>{owner.street}</div>}
                  {owner.city && <div>{owner.city}</div>}
                  {owner.county && <div>{owner.county}</div>}
                  {owner.postcode && <div>{owner.postcode}</div>}
                  {owner.country && <div>{owner.country.name}</div>}
                </dd>
              </div>
            </div>
          )}
        </dl>

        {/* T&Cs and Privacy Policy Acceptance */}
        <Separator />
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Legal Acceptance
          </h4>
          
          <dl className="space-y-3">
            {/* Terms & Conditions */}
            <div>
              <dt className="text-xs text-muted-foreground mb-1">Terms & Conditions</dt>
              <dd className="text-sm">
                {owner.termsAcceptedAt ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">
                        Accepted
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatAcceptanceDate(owner.termsAcceptedAt)}
                      </span>
                    </div>
                    {owner.termsAcceptanceId && (
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {owner.termsAcceptanceId}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(owner.termsAcceptanceId!, 'Terms acceptance ID')}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Not Accepted
                  </Badge>
                )}
              </dd>
            </div>

            {/* Privacy Policy */}
            <div>
              <dt className="text-xs text-muted-foreground mb-1">Privacy Policy</dt>
              <dd className="text-sm">
                {owner.privacyPolicyAcceptedAt ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">
                        Accepted
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatAcceptanceDate(owner.privacyPolicyAcceptedAt)}
                      </span>
                    </div>
                    {owner.privacyAcceptanceId && (
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {owner.privacyAcceptanceId}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(owner.privacyAcceptanceId!, 'Privacy acceptance ID')}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Not Accepted
                  </Badge>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Contact Actions */}
        <Separator />
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h4>
          <div className="flex flex-col gap-2">
            {/* Copy Email */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(owner.email, 'Email')}
              className="w-full justify-start gap-2"
            >
              <Mail className="h-4 w-4" />
              <span>Copy Email</span>
            </Button>

            {/* Copy Phone */}
            {owner.phone && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(owner.phone!, 'Phone number')}
                className="w-full justify-start gap-2"
              >
                <Phone className="h-4 w-4" />
                <span>Copy Phone</span>
              </Button>
            )}

            {/* WhatsApp Chat */}
            {owner.phone && (
              <Button
                variant="default"
                size="sm"
                onClick={() => openWhatsAppChat(owner.phone!)}
                className="w-full justify-start gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp Chat</span>
              </Button>
            )}
          </div>
        </div>

        {/* Other Vehicles by Owner */}
        {otherVehicles.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <Car className="h-4 w-4" />
                Other Vehicles ({otherVehicles.length})
              </h4>
              <div className="space-y-1.5">
                {otherVehicles.map((vehicle: { id: string; name: string; make?: { name: string }; model?: { name: string }; year: number; status: string }) => (
                  <Link
                    key={vehicle.id}
                    href={`/admin/vehicles/${vehicle.id}`}
                    className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {vehicle.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {vehicle.make?.name} {vehicle.model?.name} • {vehicle.year}
                      </p>
                    </div>
                    <Badge
                      variant={vehicle.status === "PUBLISHED" ? "default" : "secondary"}
                      className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0"
                    >
                      {vehicle.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

