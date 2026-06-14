"use client";

interface PageScrubberProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function PageScrubber({
  page,
  totalPages,
  onChange,
}: PageScrubberProps) {
  const progress =
    totalPages <= 1 ? 100 : ((page - 1) / (totalPages - 1)) * 100;

  return (
    <input
      type="range"
      min={1}
      max={totalPages}
      value={page}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full cursor-pointer"
      style={{ "--range-progress": `${progress}%` } as React.CSSProperties}
      aria-label={`Page ${page} of ${totalPages}`}
    />
  );
}
