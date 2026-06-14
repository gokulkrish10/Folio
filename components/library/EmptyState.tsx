import { BookOpen, Sparkles } from "lucide-react";

export function EmptyState() {
  return (
    <div className="mx-auto max-w-xl pt-8 text-center sm:pt-14">
      <div className="relative mx-auto mb-8 h-40 w-48" aria-hidden="true">
        <div className="absolute bottom-2 left-2 h-28 w-24 -rotate-6 rounded-[12px_17px_17px_12px] bg-[#c8a46c] shadow-xl" />
        <div className="absolute bottom-2 right-2 h-32 w-24 rotate-6 rounded-[17px_12px_12px_17px] bg-[#d77d56] shadow-xl" />
        <div className="absolute inset-x-9 bottom-1 grid h-36 place-items-center rounded-[14px_20px_20px_14px] bg-[#2f5548] text-[#f7efe0] shadow-2xl">
          <BookOpen size={36} strokeWidth={1.5} />
          <span className="absolute top-7 font-serif text-sm tracking-[0.22em]">
            FOLIO
          </span>
        </div>
        <Sparkles
          className="absolute -right-2 top-0 text-[var(--accent-strong)]"
          size={25}
        />
      </div>
      <h2 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
        Your next chapter starts here
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)] sm:text-base">
        Bring your PDF library with you. Your books and reading position stay
        private on this device.
      </p>
    </div>
  );
}
