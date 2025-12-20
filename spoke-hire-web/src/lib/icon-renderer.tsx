import * as React from 'react'
import {
  Car,
  Users,
  CheckCircle,
  Star,
  Shield,
  ShieldCheck,
  Clock,
  Award,
  Heart,
  Headset,
  Network,
  Globe,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { PayloadIcon } from '~/lib/payload-api'
import { getMediaUrl } from '~/lib/payload-api'

// Icon mapping for legacy string identifiers (backward compatibility)
const iconMap: Record<string, LucideIcon> = {
  car: Car,
  users: Users,
  'check-circle': CheckCircle,
  star: Star,
  shield: Shield,
  'shield-check': ShieldCheck,
  clock: Clock,
  award: Award,
  heart: Heart,
  headset: Headset,
  network: Network,
  globe: Globe,
  zap: Zap,
}

/**
 * Render an icon from either a legacy string identifier or a Payload icon object
 * 
 * @param icon - Either a string (legacy Lucide icon name) or PayloadIcon object
 * @param className - Optional CSS classes to apply to the icon
 * @returns React node representing the icon
 */
export function renderIcon(
  icon?: string | PayloadIcon | number,
  className?: string
): React.ReactNode {
  // Handle legacy string identifiers (fallback to Lucide)
  if (typeof icon === 'string') {
    const IconComponent = iconMap[icon] ?? CheckCircle
    return <IconComponent className={className} />
  }

  // Handle case where icon is just an ID (number) - depth wasn't sufficient
  if (typeof icon === 'number') {
    console.warn('[IconRenderer] Icon is a number (ID), depth may be insufficient. Falling back to CheckCircle.')
    return <CheckCircle className={className} />
  }

  // Handle Payload icon object
  if (icon && typeof icon === 'object') {
    // Check if svg is populated (could be object with url, or just an ID)
    const svg = icon.svg
    if (svg) {
      // If svg is an object with url property
      if (typeof svg === 'object' && 'url' in svg && svg.url) {
        return (
          <img
            src={getMediaUrl(svg.url)}
            alt={icon.name || ''}
            className={className}
            aria-hidden="true"
          />
        )
      }
      // If svg is just an ID (number), we need more depth
      if (typeof svg === 'number') {
        console.warn('[IconRenderer] Icon svg is a number (ID), depth may be insufficient. Falling back to CheckCircle.')
        return <CheckCircle className={className} />
      }
    }
  }

  // Fallback to CheckCircle
  return <CheckCircle className={className} />
}

/**
 * Get a Lucide icon component for legacy string identifiers
 * Used when you need the component itself rather than rendered JSX
 */
export function getIconComponent(iconName?: string): LucideIcon {
  if (!iconName || typeof iconName !== 'string') {
    return CheckCircle
  }
  return iconMap[iconName] ?? CheckCircle
}

