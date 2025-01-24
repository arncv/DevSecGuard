'use client';

import { useQuery } from '@tanstack/react-query';
import type { ScanResult } from '@/lib/scanner';

interface HistoricalScan extends ScanResult {
  userId: string;
  createdAt: Date;
}

export default function ScanHistory() {
  const { data: scans, isLoading, error } = useQuery<HistoricalScan[]>({
    queryKey: ['scanHistory'],
    queryFn: async () => {
      const response = await fetch('/api/history');
      if (!response.ok) {
        throw new Error('Failed to fetch scan history');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Recent Scans</h2>
        <div className="text-gray-500">Loading scan history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Recent Scans</h2>
        <div className="text-red-500">Failed to load scan history</div>
      </div>
    );
  }

  if (!scans?.length) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Recent Scans</h2>
        <div className="text-gray-500">No scan history available</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold">Recent Scans</h2>
      <div className="space-y-4">
        {scans.map((scan) => (
          <div
            key={scan.id}
            className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{scan.repositoryUrl}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(scan.createdAt).toLocaleString()}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  scan.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {scan.status}
              </span>
            </div>
            <div className="mt-2">
              <p className="text-sm">
                Findings:{' '}
                {scan.findings.length > 0 ? (
                  <span className="font-medium text-orange-600">
                    {scan.findings.length} issues found
                  </span>
                ) : (
                  <span className="font-medium text-green-600">No issues</span>
                )}
              </p>
              {scan.findings.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(
                    scan.findings.reduce((acc, finding) => {
                      acc[finding.severity] = (acc[finding.severity] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([severity, count]) => (
                    <span
                      key={severity}
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        severity === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : severity === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {severity}: {count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}