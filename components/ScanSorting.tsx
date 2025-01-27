'use client';

export interface SortState {
  field: 'date' | 'findings' | 'severity';
  direction: 'asc' | 'desc';
}

interface SortProps {
  onSortChange: (sort: SortState) => void;
  sort: SortState;
}

export default function ScanSorting({ onSortChange, sort }: SortProps) {
  return (
    <div className="mb-4 flex items-center space-x-4">
      <label className="text-sm font-medium text-gray-700">Sort by:</label>
      <select
        value={sort.field}
        onChange={(e) =>
          onSortChange({
            ...sort,
            field: e.target.value as SortState['field'],
          })
        }
        className="rounded-md border-gray-300 py-1 pl-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
      >
        <option value="date">Scan Date</option>
        <option value="findings">Number of Findings</option>
        <option value="severity">Severity Score</option>
      </select>

      <button
        onClick={() =>
          onSortChange({
            ...sort,
            direction: sort.direction === 'asc' ? 'desc' : 'asc',
          })
        }
        className="inline-flex items-center space-x-1 rounded-md bg-white px-2 py-1 text-sm text-gray-600 hover:bg-gray-50"
      >
        {sort.direction === 'asc' ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
        <span>{sort.direction === 'asc' ? 'Ascending' : 'Descending'}</span>
      </button>
    </div>
  );
}