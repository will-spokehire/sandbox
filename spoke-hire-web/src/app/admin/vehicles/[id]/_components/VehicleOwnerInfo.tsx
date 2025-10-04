import { Mail, Phone, MapPin, User, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";
import { formatOwnerName, getInitials } from "~/lib/vehicles";
import { type VehicleDetail } from "~/types/vehicle";

interface VehicleOwnerInfoProps {
  owner: VehicleDetail["owner"];
  vehicleId: string;
}

/**
 * Vehicle Owner Information Card
 * 
 * Displays owner contact details and account information
 */
export function VehicleOwnerInfo({ owner, vehicleId }: VehicleOwnerInfoProps) {
  const ownerName = formatOwnerName(owner.firstName, owner.lastName, owner.email);
  const initials = getInitials(owner.firstName, owner.lastName);

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
                    {owner.phone}
                  </a>
                </dd>
              </div>
            </div>
          )}

          {/* Location - We don't have full address in the owner select, so we'll skip this for now */}
          {/* If you need location, you'll need to update the tRPC query to include it */}
        </dl>

        {/* Actions */}
        <Separator />
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            asChild
          >
            <Link href={`/admin/vehicles?ownerId=${owner.id}`}>
              <ExternalLink className="h-4 w-4" />
              View All Vehicles by This Owner
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

