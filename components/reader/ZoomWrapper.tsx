"use client";

import { useRef, useState, type ReactNode, type TouchEvent } from "react";

interface ZoomWrapperProps {
  pageNumber: number;
  children: ReactNode;
}

function distance(touches: React.TouchList) {
  const x = touches[0].clientX - touches[1].clientX;
  const y = touches[0].clientY - touches[1].clientY;
  return Math.hypot(x, y);
}

export function ZoomWrapper({ pageNumber, children }: ZoomWrapperProps) {
  const [scale, setScale] = useState(1);
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);
  const lastTap = useRef(0);

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      pinchStart.current = {
        distance: distance(event.touches),
        scale,
      };
    }
  };

  const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2 || !pinchStart.current) return;
    event.preventDefault();
    const ratio = distance(event.touches) / pinchStart.current.distance;
    setScale(Math.min(3, Math.max(1, pinchStart.current.scale * ratio)));
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (
      !pinchStart.current &&
      event.changedTouches.length === 1 &&
      now - lastTap.current < 280
    ) {
      event.stopPropagation();
      setScale((current) => (current > 1 ? 1 : 1.5));
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
    pinchStart.current = null;
    setScale((current) => (current < 1.08 ? 1 : current));
  };

  const toggleZoom = () => setScale((current) => (current > 1 ? 1 : 1.5));

  return (
    <div
      className="w-full origin-top transition-transform duration-200 ease-out"
      style={{
        transform: `scale(${scale})`,
        touchAction: scale > 1 ? "none" : "pan-y",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onDoubleClick={(event) => {
        event.stopPropagation();
        toggleZoom();
      }}
      aria-label={`Page zoom ${Math.round(scale * 100)} percent`}
      data-page={pageNumber}
    >
      {children}
    </div>
  );
}
