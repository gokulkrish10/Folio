"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[75] flex items-end justify-center bg-black/45 backdrop-blur-sm md:items-center md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            className="surface-panel max-h-[82dvh] w-full overflow-hidden rounded-t-[30px] shadow-2xl md:max-w-lg md:rounded-[30px]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-current opacity-15 md:hidden" />
            <header className="flex items-center justify-between gap-4 px-5 pb-3 pt-4">
              <h2 id="sheet-title" className="text-xl font-semibold">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="icon-button"
                aria-label="Close panel"
              >
                <X size={20} />
              </button>
            </header>
            <div className="max-h-[calc(82dvh-72px)] overflow-y-auto px-5 pb-[max(24px,env(safe-area-inset-bottom))]">
              {children}
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
