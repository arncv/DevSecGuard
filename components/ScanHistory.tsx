'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import type { ScanResult, Finding } from '@/lib/scanner';
import { useState } from 'react';
import ScanFilters, { FilterState } from './ScanFilters';
import ScanSorting, { SortState } from './ScanSorting';
import ScanStats from './ScanStats';
import StateDisplay from './StateDisplay';

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
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    severity: '',
    type: '',
  });

  const [sort, setSort] = useState<SortState>({
    field: 'date',
    direction: 'desc',
  });

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
        <StateDisplay type="loading" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <StateDisplay type="error" message={error instanceof Error ? error.message : 'An error occurred'} />
      </div>
    );
  }

  if (!scans?.length) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <StateDisplay type="empty" />
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
    switch (type as Finding['type']) {
      case 'secret':
        return 'bg-purple-100 text-purple-700';
      case 'vulnerability':
        return 'bg-orange-100 text-orange-700';
      case 'code_smell':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRemediationAdvice = (type: Finding['type']) => {
    switch (type) {
      case 'secret':
        return 'Remove sensitive data from code and store in secure environment variables or a secrets management system.';
      case 'vulnerability':
        return 'Update dependencies to their latest secure versions and follow secure coding practices.';
      case 'code_smell':
        return 'Review and address the code quality issue following best practices.';
      default:
        return 'Review and fix this issue following security best practices.';
    }
  };

  const filteredScans = scans.filter(scan => {
    if (filters.status && scan.status !== filters.status) {
      return false;
    }

    if (filters.severity || filters.type) {
      const stats = calculateStats(scan.findings);
      
      if (filters.severity && !stats.bySeverity[filters.severity]) {
        return false;
      }

      if (filters.type && !stats.byType[filters.type]) {
        return false;
      }
    }

    return true;
  });

  const sortedScans = [...filteredScans].sort((a, b) => {
    const multiplier = sort.direction === 'asc' ? 1 : -1;

    switch (sort.field) {
      case 'date':
        return multiplier * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      case 'findings': {
        const aStats = calculateStats(a.findings);
        const bStats = calculateStats(b.findings);
        return multiplier * (aStats.totalCount - bStats.totalCount);
      }

      case 'severity': {
        const aStats = calculateStats(a.findings);
        const bStats = calculateStats(b.findings);
        const aScore = aStats.averageSeverityScore || 0;
        const bScore = bStats.averageSeverityScore || 0;
        return multiplier * (aScore - bScore);
      }

      default:
        return 0;
    }
  });

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold">Recent Scans</h2>
      {sortedScans.length > 0 && (
        <ScanStats findings={sortedScans.flatMap(scan => scan.findings)} />
      )}
      <ScanFilters filters={filters} onFilterChange={setFilters} />
      <ScanSorting sort={sort} onSortChange={setSort} />
      <div className="space-y-4">
        {sortedScans.map((scan) => {
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
                    {new Date(scan.createdAt).toLocaleDateString()} {new Date(scan.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {scan.status === 'completed' && stats.totalCount === 0 && (
                    <div className="flex items-center">
                      <CheckCircleIcon
                        className="h-5 w-5 text-green-500"
                        aria-hidden="true"
                        title="No issues found"
                      />
                    </div>
                  )}
                  {scan.status === 'completed' && stats.totalCount > 0 && (
                    <div className="flex items-center">
                      <ExclamationCircleIcon
                        className="h-5 w-5 text-orange-500"
                        aria-hidden="true"
                        title={`${stats.totalCount} issues found`}
                      />
                    </div>
                  )}
                  {scan.status === 'failed' && (
                    <div className="flex items-center">
                      <XCircleIcon
                        className="h-5 w-5 text-red-500"
                        aria-hidden="true"
                        title="Scan failed"
                      />
                    </div>
                  )}
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      scan.status === 'completed'
                        ? stats.totalCount === 0
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {scan.status}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-sm">
                  Findings:{' '}
                  <span className={`font-medium ${stats.totalCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {stats.totalCount > 0 ? `${stats.totalCount} issues found` : 'No issues'}
                  </span>
                </p>
                {stats.totalCount > 0 && (
                  <>
                    <p className="mt-1 text-sm text-gray-500">
                      Summary: {Object.entries(stats.bySeverity)
                        .filter(([_, count]) => count > 0)
                        .map(([severity, count]) => `${count} ${severity}`)
                        .join(', ')}
                    </p>
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
                    <div className="mt-4">
                      <h4 className="mb-2 text-sm font-medium text-gray-700">Remediation Advice:</h4>
                      <div className="space-y-2">
                        {Object.entries(stats.byType)
                          .filter(([_, count]) => count > 0)
                          .map(([type]) => (
                            <div
                              key={type}
                              className="rounded-md bg-blue-50 p-3"
                            >
                              <div className="flex">
                                <div className="ml-3">
                                  <h5 className="text-sm font-medium text-blue-800">
                                    {type.charAt(0).toUpperCase() + type.slice(1)} Issues
                                  </h5>
                                  <div className="mt-2 text-sm text-blue-700">
                                    <p>{getRemediationAdvice(type as Finding['type'])}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
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