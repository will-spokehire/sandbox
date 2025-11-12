import { useRef, useEffect, type RefObject } from 'react';

interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

interface SwipeOptions {
  threshold?: number; // Minimum distance in pixels to trigger swipe
  preventDefaultTouchMove?: boolean; // Prevent default on touchmove
}

/**
 * Custom hook for detecting swipe gestures on touch devices
 * 
 * @param callbacks - Object containing onSwipeLeft and onSwipeRight callbacks
 * @param options - Configuration options for swipe detection
 * @returns A ref to attach to the swipeable element
 * 
 * @example
 * ```tsx
 * const swipeRef = useSwipeGesture({
 *   onSwipeLeft: () => goToNext(),
 *   onSwipeRight: () => goToPrevious()
 * });
 * 
 * return <div ref={swipeRef}>Swipeable content</div>
 * ```
 */
export function useSwipeGesture<T extends HTMLElement>(
  callbacks: SwipeCallbacks,
  options: SwipeOptions = {}
): RefObject<T> {
  const { threshold = 50, preventDefaultTouchMove = false } = options;
  const { onSwipeLeft, onSwipeRight } = callbacks;
  
  const elementRef = useRef<T>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0]?.clientX ?? 0;
      touchStartY.current = e.touches[0]?.clientY ?? 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0]?.clientX ?? 0;
      touchEndY.current = e.touches[0]?.clientY ?? 0;

      // Calculate deltas
      const deltaX = Math.abs(touchEndX.current - touchStartX.current);
      const deltaY = Math.abs(touchEndY.current - touchStartY.current);

      // If horizontal swipe is more pronounced than vertical, prevent default
      // This allows vertical scrolling while enabling horizontal swiping
      if (preventDefaultTouchMove && deltaX > deltaY && deltaX > threshold / 2) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      const deltaX = touchEndX.current - touchStartX.current;
      const deltaY = Math.abs(touchEndY.current - touchStartY.current);
      
      // Only trigger swipe if horizontal movement exceeds threshold
      // and is more significant than vertical movement (to preserve scroll)
      if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > deltaY) {
        if (deltaX < 0 && onSwipeLeft) {
          // Swiped left (next)
          onSwipeLeft();
        } else if (deltaX > 0 && onSwipeRight) {
          // Swiped right (previous)
          onSwipeRight();
        }
      }

      // Reset values
      touchStartX.current = 0;
      touchStartY.current = 0;
      touchEndX.current = 0;
      touchEndY.current = 0;
    };

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { 
      passive: !preventDefaultTouchMove 
    });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Cleanup
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold, preventDefaultTouchMove]);

  return elementRef;
}




