import InspectClientWrapper from './InspectClientWrapper';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inspect — AI Smart Resale Inspector',
  description: 'Scan an item and get an instant AI-powered inspection report.',
};

export default function InspectPage() {
  return (
    <main className="min-h-[calc(100vh-56px-80px)]">
      <InspectClientWrapper />
    </main>
  );
}
