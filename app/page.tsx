'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
  const { status } = useSession();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="py-16 sm:py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            DevSecGuard
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Proactively identify security vulnerabilities in your code repositories.
            Scan for exposed secrets, potential SQL injection points, and XSS vulnerabilities.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {status === 'authenticated' ? (
              <Link
                href="/dashboard"
                className="rounded-md bg-primary px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-opacity-90"
              >
                Go to Dashboard
              </Link>
            ) : status === 'unauthenticated' ? (
              <Link
                href="/auth/signin"
                className="rounded-md bg-primary px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-opacity-90"
              >
                Get Started
              </Link>
            ) : (
              // Loading state
              <div className="rounded-md bg-primary px-6 py-3 text-lg font-semibold text-white opacity-50">
                Loading...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-6">
            <div className="mb-4">
              <svg
                className="h-12 w-12 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Secret Detection</h3>
            <p className="text-gray-600">
              Identify exposed API keys, tokens, and credentials in your code before they reach production.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-6">
            <div className="mb-4">
              <svg
                className="h-12 w-12 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Vulnerability Scanning</h3>
            <p className="text-gray-600">
              Detect common security vulnerabilities like SQL injection and XSS patterns in your code.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-6">
            <div className="mb-4">
              <svg
                className="h-12 w-12 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Scan History</h3>
            <p className="text-gray-600">
              Keep track of all your security scans and monitor your repositories' security health over time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}