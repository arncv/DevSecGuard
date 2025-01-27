'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { Finding } from '@/lib/scanner';

interface ScanStatsProps {
  findings: Finding[];
}

const SEVERITY_COLORS = {
  critical: '#EF4444', // red
  high: '#F97316',     // orange
  medium: '#EAB308',   // yellow
  low: '#3B82F6',      // blue
};

const TYPE_COLORS = {
  secret: '#8B5CF6',      // purple
  vulnerability: '#F97316', // orange
  dependency: '#6B7280',   // gray
};

export default function ScanStats({ findings }: ScanStatsProps) {
  // Prepare data for severity chart
  const severityData = findings.reduce((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const severityChartData = Object.entries(severityData).map(([name, value]) => ({
    name,
    value,
  }));

  // Prepare data for type chart
  const typeData = findings.reduce((acc, finding) => {
    acc[finding.type] = (acc[finding.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeChartData = Object.entries(typeData).map(([name, value]) => ({
    name,
    value,
  }));

  if (findings.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Findings Distribution</h3>
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-[300px] rounded-lg border border-gray-200 p-4">
            <h4 className="mb-4 text-sm font-medium text-gray-700">By Severity</h4>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {severityChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS] || '#6B7280'}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[300px] rounded-lg border border-gray-200 p-4">
            <h4 className="mb-4 text-sm font-medium text-gray-700">By Type</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value">
                  {typeChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={TYPE_COLORS[entry.name as keyof typeof TYPE_COLORS] || '#6B7280'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}