"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";

interface PageJumpModalProps {
  open: boolean;
  currentPage: number;
  totalPages: number;
  onClose: () => void;
  onJump: (page: number) => void;
}

export function PageJumpModal({
  open,
  currentPage,
  totalPages,
  onClose,
  onJump,
}: PageJumpModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Go to page">
      <PageJumpForm
        currentPage={currentPage}
        totalPages={totalPages}
        onClose={onClose}
        onJump={onJump}
      />
    </Modal>
  );
}

function PageJumpForm({
  currentPage,
  totalPages,
  onClose,
  onJump,
}: Omit<PageJumpModalProps, "open">) {
  const [value, setValue] = useState(String(currentPage));
  const page = Number(value);
  const valid = Number.isInteger(page) && page >= 1 && page <= totalPages;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    onJump(page);
    onClose();
  };

  return (
    <form onSubmit={submit}>
      <label
        htmlFor="page-number"
        className="mb-2 block text-sm font-medium text-[var(--muted)]"
      >
        Enter a page from 1 to {totalPages}
      </label>
      <input
        id="page-number"
        type="number"
        inputMode="numeric"
        min={1}
        max={totalPages}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="min-h-14 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 text-lg"
        autoFocus
      />
      {!valid && value ? (
        <p className="mt-2 text-sm text-red-600">
          Choose a page between 1 and {totalPages}.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={!valid}
        className="button-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-40"
      >
        Open page
      </button>
    </form>
  );
}
