'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { ScanResult, Finding } from '@/lib/scanner';
import ScanHistory from '@/components/ScanHistory';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.includes('github.com')) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }

    setScanning(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan repository');
      }

      setResult(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Security Scanner</h1>
        <div className="text-sm text-gray-600">
          Logged in as: <span className="font-medium">{session?.user?.email}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">New Scan</h2>
            <form onSubmit={handleScan}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="repo-url" className="mb-2 block text-sm font-medium text-gray-700">
                    GitHub Repository URL
                  </label>
                  <input
                    id="repo-url"
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    className="w-full rounded-lg border border-gray-300 p-2"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={scanning}
                  className="w-full rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
                >
                  {scanning ? 'Scanning...' : 'Scan Repository'}
                </button>
              </div>
            </form>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Scan Results</h2>
              <div className="mb-4">
                <p>
                  <span className="font-medium">Repository:</span>{' '}
                  {result.repositoryUrl}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  <span
                    className={
                      result.status === 'completed'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {result.status}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Scan Date:</span>{' '}
                  {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>

              {result.findings.length > 0 ? (
                <div>
                  <h3 className="mb-2 font-medium">Findings:</h3>
                  <div className="space-y-4">
                    {result.findings.map((finding: Finding, index: number) => (
                      <div
                        key={index}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-block rounded-full px-2 py-1 text-sm font-semibold ${
                              finding.severity === 'critical'
                                ? 'bg-red-100 text-red-700'
                                : finding.severity === 'high'
                                ? 'bg-orange-100 text-orange-700'
                                : finding.severity === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {finding.severity}
                          </span>
                          <span className="text-sm text-gray-500">
                            {finding.type}
                          </span>
                        </div>
                        <p className="mt-2">{finding.description}</p>
                        <p className="mt-1 text-sm text-gray-600">
                          File: {finding.file}:{finding.line}
                        </p>
                        {finding.code && (
                          <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-2 text-sm">
                            <code>{finding.code}</code>
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-green-600">No security issues found!</p>
              )}
            </div>
          )}
        </div>

        <div>
          <ScanHistory />
        </div>
      </div>
    </div>
  );
}