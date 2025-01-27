'use client';

interface FilterProps {
  onFilterChange: (filters: FilterState) => void;
  filters: FilterState;
}

export interface FilterState {
  status: string;
  severity: string;
  type: string;
}

export default function ScanFilters({ onFilterChange, filters }: FilterProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        >
          <option value="">All</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Severity</label>
        <select
          value={filters.severity}
          onChange={(e) => onFilterChange({ ...filters, severity: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        >
          <option value="">All</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <select
          value={filters.type}
          onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        >
          <option value="">All</option>
          <option value="secret">Secrets</option>
          <option value="vulnerability">Vulnerabilities</option>
          <option value="code_smell">Code Smells</option>
        </select>
      </div>
    </div>
  );
}