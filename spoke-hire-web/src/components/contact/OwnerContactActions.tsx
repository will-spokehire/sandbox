/**
 * Owner Contact Actions Component
 * 
 * Reusable component for owner contact actions (Copy Email, Copy Phone, WhatsApp)
 * Can be used in dropdown menus or as standalone buttons
 */

import { Mail, Phone, MessageCircle } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { useClipboard } from "~/hooks/useClipboard";
import { getWhatsAppChatUrl } from "~/lib/whatsapp";

interface OwnerContactInfo {
  email: string;
  phone: string | null;
}

interface OwnerContactActionsProps {
  owner: OwnerContactInfo;
  /** If true, renders as dropdown menu items. If false, renders as buttons */
  asDropdownItems?: boolean;
  /** For button mode: if true, renders full-width buttons */
  fullWidth?: boolean;
  /** Show section label (only for dropdown items) */
  showLabel?: boolean;
}

/**
 * Renders contact actions as dropdown menu items
 */
export function OwnerContactDropdownItems({ 
  owner, 
  showLabel = true 
}: Pick<OwnerContactActionsProps, "owner" | "showLabel">) {
  const { copyToClipboard } = useClipboard();

  return (
    <>
      {showLabel && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Contact Owner</DropdownMenuLabel>
        </>
      )}
      
      {/* Copy Email */}
      <DropdownMenuItem
        onClick={(e) => {
          e.stopPropagation();
          void copyToClipboard(owner.email, 'Email');
        }}
      >
        <Mail className="mr-2 h-4 w-4" />
        Copy Email
      </DropdownMenuItem>
      
      {/* Copy Phone */}
      {owner.phone && (
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            void copyToClipboard(owner.phone!, 'Phone number');
          }}
        >
          <Phone className="mr-2 h-4 w-4" />
          Copy Phone
        </DropdownMenuItem>
      )}
      
      {/* WhatsApp Chat */}
      {owner.phone && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              window.open(getWhatsAppChatUrl(owner.phone!), '_blank');
            }}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp Chat
          </DropdownMenuItem>
        </>
      )}
    </>
  );
}

/**
 * Renders contact actions as buttons
 */
export function OwnerContactButtons({ 
  owner, 
  fullWidth = true 
}: Pick<OwnerContactActionsProps, "owner" | "fullWidth">) {
  const { copyToClipboard } = useClipboard();

  const buttonClass = fullWidth ? "w-full justify-start gap-2" : "gap-2";

  return (
    <div className={fullWidth ? "flex flex-col gap-2" : "flex gap-2"}>
      {/* Copy Email */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => copyToClipboard(owner.email, 'Email')}
        className={buttonClass}
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
          className={buttonClass}
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
          onClick={() => window.open(getWhatsAppChatUrl(owner.phone!), '_blank')}
          className={buttonClass}
        >
          <MessageCircle className="h-4 w-4" />
          <span>WhatsApp Chat</span>
        </Button>
      )}
    </div>
  );
}

/**
 * Main component that renders based on mode
 */
export function OwnerContactActions({ 
  owner, 
  asDropdownItems = false,
  fullWidth = true,
  showLabel = true,
}: OwnerContactActionsProps) {
  if (asDropdownItems) {
    return <OwnerContactDropdownItems owner={owner} showLabel={showLabel} />;
  }
  
  return <OwnerContactButtons owner={owner} fullWidth={fullWidth} />;
}

