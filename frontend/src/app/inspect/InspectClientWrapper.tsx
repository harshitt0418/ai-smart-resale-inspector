'use client';

import dynamic from 'next/dynamic';

// ssr: false must live inside a Client Component — not a Server Component.
// This wrapper exists solely to satisfy that constraint while keeping the
// parent page.tsx as a Server Component (so it can export `metadata`).
const InspectLayout = dynamic(
  () => import('@/components/inspect/InspectLayout'),
  { ssr: false },
);

export default function InspectClientWrapper() {
  return <InspectLayout />;
}
