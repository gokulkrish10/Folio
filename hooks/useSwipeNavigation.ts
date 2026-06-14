"use client";

import { useSwipeable } from "react-swipeable";

export function useSwipeNavigation(
  onPrevious: () => void,
  onNext: () => void,
  enabled = true,
) {
  return useSwipeable({
    onSwipedLeft: onNext,
    onSwipedRight: onPrevious,
    delta: 45,
    preventScrollOnSwipe: true,
    trackMouse: false,
    trackTouch: enabled,
    swipeDuration: 650,
  });
}
