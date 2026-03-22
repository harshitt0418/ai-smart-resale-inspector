'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Download, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface ReportEntry {
  filename: string;
  url: string;
  createdAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:5000';

export default function ReportsPage() {
  const [reports, setReports]   = useState<ReportEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/report/list`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = await res.json();
      setReports(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-grotesk font-bold text-2xl text-brand-white">Inspection Reports</h1>
          <p className="text-brand-muted text-sm mt-1">PDF reports generated from past inspections</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={fetchReports}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {/* States */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-brand-surface animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <Card className="flex items-start gap-3 p-5" padding="none">
          <AlertCircle className="w-5 h-5 text-brand-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-brand-white font-medium">Could not load reports</p>
            <p className="text-brand-muted text-sm mt-0.5">{error}</p>
            <p className="text-brand-muted text-xs mt-2">Make sure the backend is running at <code className="text-brand-accent">localhost:5000</code></p>
          </div>
        </Card>
      )}

      {!loading && !error && reports.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-16 text-center" padding="none">
          <FileText className="w-10 h-10 text-brand-border" />
          <p className="text-brand-white font-medium">No reports yet</p>
          <p className="text-brand-muted text-sm">Complete an inspection to generate your first PDF report.</p>
          <Link href="/inspect">
            <Button variant="primary" size="sm" className="mt-2">Start Inspection</Button>
          </Link>
        </Card>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.filename} className="flex items-center gap-4 px-5 py-4" padding="none">
              <FileText className="w-5 h-5 text-brand-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-brand-white text-sm font-medium truncate">{r.filename}</p>
                <p className="flex items-center gap-1 text-brand-muted text-xs mt-0.5">
                  <Clock className="w-3 h-3" />
                  {new Date(r.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium', timeStyle: 'short',
                  })}
                </p>
              </div>
              <a
                href={`${API_BASE}${r.url}`}
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                  Download
                </Button>
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
