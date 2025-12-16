/**
 * UI Components
 *
 * Reusable UI components for the SpokeHire design system.
 * This file exports all custom brand components.
 *
 * Note: shadcn/ui components should be imported directly from their files.
 * Note: Pagination is exported from ~/app/_components/ui
 */

// Brand components
export { Button, buttonVariants, type ButtonProps } from "./button"
export {
  AccordionDetails,
  type AccordionDetailsProps,
  type AccordionDetailItem,
} from "./accordion-details"
export { FilterButton, type FilterButtonProps } from "./filter-button"
export { ProgressStepper, type ProgressStepperProps } from "./progress-stepper"
export {
  StatsBadge,
  StatsBadgeGroup,
  type StatsBadgeProps,
  type StatsBadgeGroupProps,
} from "./stats-badge"
export { CarouselDots, type CarouselDotsProps } from "./carousel-dots"
export { StarRating, type StarRatingProps } from "./star-rating"
export {
  ImageGallery,
  type ImageGalleryProps,
  type GalleryImage,
} from "./image-gallery"

