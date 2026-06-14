import type { Metadata } from "next";
import { ReaderScreen } from "@/components/reader/ReaderScreen";
import { ReaderProvider } from "@/contexts/ReaderContext";

export const metadata: Metadata = {
  title: "Reader",
};

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;

  return (
    <ReaderProvider>
      <ReaderScreen bookId={bookId} />
    </ReaderProvider>
  );
}
