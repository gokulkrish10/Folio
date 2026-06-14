"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type TouchEvent,
} from "react";

interface Point {
  x: number;
  y: number;
}

type Gesture =
  | {
      type: "pinch";
      distance: number;
      scale: number;
      contentPoint: Point;
    }
  | {
      type: "pan";
      start: Point;
      pan: Point;
    };

interface ZoomWrapperProps {
  pageNumber: number;
  scale: number;
  onScaleChange: (scale: number) => void;
  children: ReactNode;
}

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const DOUBLE_TAP_SCALE = 1.5;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function touchPoint(touch: React.Touch) {
  return { x: touch.clientX, y: touch.clientY };
}

function touchCenter(touches: React.TouchList) {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

function touchDistance(touches: React.TouchList) {
  const x = touches[0].clientX - touches[1].clientX;
  const y = touches[0].clientY - touches[1].clientY;
  return Math.hypot(x, y);
}

export function ZoomWrapper({
  pageNumber,
  scale,
  onScaleChange,
  children,
}: ZoomWrapperProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(scale);
  const panRef = useRef<Point>({ x: 0, y: 0 });
  const gestureRef = useRef<Gesture | null>(null);
  const tapStartRef = useRef<Point | null>(null);
  const lastTapRef = useRef(0);
  const movedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [interacting, setInteracting] = useState(false);

  const zoomed = scale > MIN_SCALE + 0.01;

  useEffect(() => {
    scaleRef.current = scale;
    if (scale <= MIN_SCALE + 0.01) {
      panRef.current = { x: 0, y: 0 };
    }
  }, [scale]);

  const commitPan = (point: Point) => {
    panRef.current = point;
    setPan(point);
  };

  const suppressNextClick = () => {
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 350);
  };

  const boundsFor = (targetScale: number) => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    const canvas = content?.querySelector("canvas");
    if (!viewport || !content) {
      return { maxX: 0, minY: 0 };
    }

    const contentWidth = canvas?.clientWidth || content.clientWidth;
    const contentHeight = Math.max(
      canvas?.clientHeight || 0,
      content.scrollHeight,
    );

    return {
      maxX: Math.max(0, (contentWidth * targetScale - viewport.clientWidth) / 2),
      minY: Math.min(0, viewport.clientHeight - contentHeight * targetScale),
    };
  };

  const boundedPan = (point: Point, targetScale: number) => {
    const { maxX, minY } = boundsFor(targetScale);
    return {
      x: clamp(point.x, -maxX, maxX),
      y: clamp(point.y, minY, 0),
    };
  };

  const zoomAt = (targetScale: number, clientPoint: Point) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const nextScale = clamp(targetScale, MIN_SCALE, MAX_SCALE);
    if (nextScale <= MIN_SCALE + 0.01) {
      scaleRef.current = MIN_SCALE;
      commitPan({ x: 0, y: 0 });
      onScaleChange(MIN_SCALE);
      return;
    }

    const rect = viewport.getBoundingClientRect();
    const local = {
      x: clientPoint.x - rect.left,
      y: clientPoint.y - rect.top,
    };
    const currentScale = scaleRef.current;
    const currentPan = panRef.current;
    const contentPoint = {
      x: (local.x - rect.width / 2 - currentPan.x) / currentScale,
      y: (local.y - currentPan.y) / currentScale,
    };
    const nextPan = boundedPan(
      {
        x: local.x - rect.width / 2 - contentPoint.x * nextScale,
        y: local.y - contentPoint.y * nextScale,
      },
      nextScale,
    );

    scaleRef.current = nextScale;
    commitPan(nextPan);
    onScaleChange(nextScale);
  };

  const handleTap = (
    point: Point,
    event: TouchEvent<HTMLDivElement>,
  ) => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      event.preventDefault();
      event.stopPropagation();
      suppressNextClick();
      zoomAt(
        scaleRef.current > MIN_SCALE + 0.01
          ? MIN_SCALE
          : DOUBLE_TAP_SCALE,
        point,
      );
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
  };

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    movedRef.current = false;
    setInteracting(true);

    if (event.touches.length === 2) {
      event.preventDefault();
      event.stopPropagation();
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const center = touchCenter(event.touches);
      const localCenter = {
        x: center.x - rect.left,
        y: center.y - rect.top,
      };
      gestureRef.current = {
        type: "pinch",
        distance: touchDistance(event.touches),
        scale: scaleRef.current,
        contentPoint: {
          x:
            (localCenter.x - rect.width / 2 - panRef.current.x) /
            scaleRef.current,
          y: (localCenter.y - panRef.current.y) / scaleRef.current,
        },
      };
      movedRef.current = true;
      return;
    }

    if (event.touches.length === 1) {
      const point = touchPoint(event.touches[0]);
      tapStartRef.current = point;
      if (scaleRef.current > MIN_SCALE + 0.01) {
        gestureRef.current = {
          type: "pan",
          start: point,
          pan: panRef.current,
        };
      }
    }
  };

  const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    const tapStart = tapStartRef.current;

    if (tapStart && event.touches.length === 1) {
      const point = touchPoint(event.touches[0]);
      if (Math.hypot(point.x - tapStart.x, point.y - tapStart.y) > 6) {
        movedRef.current = true;
      }
    }

    if (
      gesture?.type === "pinch" &&
      event.touches.length === 2 &&
      viewportRef.current
    ) {
      event.preventDefault();
      event.stopPropagation();
      const targetScale = clamp(
        gesture.scale *
          (touchDistance(event.touches) / Math.max(gesture.distance, 1)),
        MIN_SCALE,
        MAX_SCALE,
      );
      const rect = viewportRef.current.getBoundingClientRect();
      const center = touchCenter(event.touches);
      const localCenter = {
        x: center.x - rect.left,
        y: center.y - rect.top,
      };
      const nextPan = boundedPan(
        {
          x:
            localCenter.x -
            rect.width / 2 -
            gesture.contentPoint.x * targetScale,
          y: localCenter.y - gesture.contentPoint.y * targetScale,
        },
        targetScale,
      );

      scaleRef.current = targetScale;
      commitPan(nextPan);
      onScaleChange(targetScale);
      return;
    }

    if (gesture?.type === "pan" && event.touches.length === 1) {
      event.preventDefault();
      event.stopPropagation();
      const point = touchPoint(event.touches[0]);
      commitPan(
        boundedPan(
          {
            x: gesture.pan.x + point.x - gesture.start.x,
            y: gesture.pan.y + point.y - gesture.start.y,
          },
          scaleRef.current,
        ),
      );
    }
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    const wasMoved = movedRef.current;

    if (gesture?.type === "pinch" && event.touches.length === 1) {
      const point = touchPoint(event.touches[0]);
      gestureRef.current = {
        type: "pan",
        start: point,
        pan: panRef.current,
      };
      return;
    }

    if (event.touches.length === 0) {
      gestureRef.current = null;
      setInteracting(false);

      if (scaleRef.current < 1.04) {
        scaleRef.current = MIN_SCALE;
        commitPan({ x: 0, y: 0 });
        onScaleChange(MIN_SCALE);
      }

      if (!wasMoved && event.changedTouches.length === 1) {
        handleTap(touchPoint(event.changedTouches[0]), event);
      } else if (wasMoved) {
        event.preventDefault();
        event.stopPropagation();
        suppressNextClick();
      }
    }
  };

  const onDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    zoomAt(
      scaleRef.current > MIN_SCALE + 0.01
        ? MIN_SCALE
        : DOUBLE_TAP_SCALE,
      { x: event.clientX, y: event.clientY },
    );
  };

  const onMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || scaleRef.current <= MIN_SCALE + 0.01) return;
    event.preventDefault();
    event.stopPropagation();
    const point = { x: event.clientX, y: event.clientY };
    movedRef.current = false;
    setInteracting(true);
    gestureRef.current = {
      type: "pan",
      start: point,
      pan: panRef.current,
    };
  };

  const onMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (gesture?.type !== "pan" || event.buttons !== 1) return;
    event.preventDefault();
    event.stopPropagation();
    const point = { x: event.clientX, y: event.clientY };
    if (Math.hypot(point.x - gesture.start.x, point.y - gesture.start.y) > 3) {
      movedRef.current = true;
    }
    commitPan(
      boundedPan(
        {
          x: gesture.pan.x + point.x - gesture.start.x,
          y: gesture.pan.y + point.y - gesture.start.y,
        },
        scaleRef.current,
      ),
    );
  };

  const finishMousePan = (event: MouseEvent<HTMLDivElement>) => {
    if (gestureRef.current?.type !== "pan") return;
    if (movedRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressNextClick();
    }
    gestureRef.current = null;
    setInteracting(false);
  };

  return (
    <div
      ref={viewportRef}
      className={`relative min-h-dvh w-full ${
        zoomed ? "h-dvh overflow-hidden overscroll-none" : "overflow-visible"
      }`}
      style={{ touchAction: zoomed ? "none" : "pan-y" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => {
        gestureRef.current = null;
        setInteracting(false);
      }}
      onClick={(event) => {
        if (!suppressClickRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        suppressClickRef.current = false;
      }}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={finishMousePan}
      aria-label={`Page zoom ${Math.round(scale * 100)} percent`}
      data-page={pageNumber}
      data-zoomed={zoomed}
      data-pan-x={Math.round(pan.x)}
      data-pan-y={Math.round(pan.y)}
      role="region"
    >
      <div
        ref={contentRef}
        className={`w-full origin-top ${
          interacting ? "" : "transition-transform duration-200 ease-out"
        }`}
        style={{
          transform: zoomed
            ? `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`
            : "translate3d(0, 0, 0) scale(1)",
          willChange: zoomed ? "transform" : "auto",
          cursor: zoomed ? (interacting ? "grabbing" : "grab") : "default",
        }}
      >
        {children}
      </div>
    </div>
  );
}
