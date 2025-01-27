'use client';

interface StateDisplayProps {
  type: 'empty' | 'loading' | 'error';
  title?: string;
  message?: string;
}

export default function StateDisplay({ type, title, message }: StateDisplayProps) {
  const getIcon = () => {
    switch (type) {
      case 'empty':
        return (
          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      case 'loading':
        return (
          <svg className="h-12 w-12 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'empty':
        return 'No Scan History';
      case 'loading':
        return 'Loading Scans';
      case 'error':
        return 'Error Loading Scans';
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'empty':
        return 'Start your first security scan by entering a repository URL above.';
      case 'loading':
        return 'Please wait while we fetch your scan history...';
      case 'error':
        return 'There was a problem loading the scan history. Please try again.';
    }
  };

  return (
    <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
      {getIcon()}
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title || getDefaultTitle()}</h3>
      <p className="mt-2 text-sm text-gray-500">{message || getDefaultMessage()}</p>
      {type === 'error' && (
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      )}
    </div>
  );
}