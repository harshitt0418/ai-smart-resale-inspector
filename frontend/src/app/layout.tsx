import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Smart Resale Inspector',
  description: 'AI-powered item inspection, damage detection, and resale valuation system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-brand-bg text-brand-white antialiased flex flex-col min-h-screen`}>
        <Navbar />
        {/* Push page content below fixed navbar */}
        <div className="flex-1 pt-14">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
