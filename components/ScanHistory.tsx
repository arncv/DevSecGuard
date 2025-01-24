'use client';

import { useQuery } from '@tanstack/react-query';
import type { ScanResult, Finding } from '@/lib/scanner';

interface FindingStats {
  totalCount: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  averageSeverityScore?: number;
}

interface HistoricalScan extends ScanResult {
  userId: string;
  createdAt: string;
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

  const calculateStats = (findings: Finding[]): FindingStats => {
    const stats: FindingStats = {
      totalCount: findings.length,
      byType: {},
      bySeverity: {},
    };

    let totalSeverityScore = 0;
    let findingsWithScore = 0;

    findings.forEach(finding => {
      // Count by type
      stats.byType[finding.type] = (stats.byType[finding.type] || 0) + 1;

      // Count by severity
      stats.bySeverity[finding.severity] = (stats.bySeverity[finding.severity] || 0) + 1;

      // Calculate average severity score
      if (finding.severityScore) {
        totalSeverityScore += finding.severityScore;
        findingsWithScore++;
      }
    });

    if (findingsWithScore > 0) {
      stats.averageSeverityScore = Math.round(totalSeverityScore / findingsWithScore);
    }

    return stats;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'secret':
        return 'bg-purple-100 text-purple-700';
      case 'vulnerability':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold">Recent Scans</h2>
      <div className="space-y-4">
        {scans.map((scan) => {
          const stats = calculateStats(scan.findings);
          return (
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
                  {stats.totalCount > 0 ? (
                    <span className="font-medium text-orange-600">
                      {stats.totalCount} issues found
                    </span>
                  ) : (
                    <span className="font-medium text-green-600">No issues</span>
                  )}
                </p>
                {stats.totalCount > 0 && (
                  <div className="mt-2 space-y-3">
                    <div>
                      <h4 className="mb-1 text-sm font-medium text-gray-700">By Severity:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.bySeverity).map(([severity, count]) => (
                          <span
                            key={severity}
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getSeverityColor(severity)}`}
                          >
                            {severity}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-1 text-sm font-medium text-gray-700">By Type:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.byType).map(([type, count]) => (
                          <span
                            key={type}
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getTypeColor(type)}`}
                          >
                            {type}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {stats.averageSeverityScore !== undefined && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Average Severity Score:{' '}
                      <span className="font-medium">{stats.averageSeverityScore}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}