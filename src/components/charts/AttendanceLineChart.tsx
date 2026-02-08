import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MonthlyAttendance } from '@/types';

interface AttendanceLineChartProps {
  data: MonthlyAttendance[];
}

export function AttendanceLineChart({ data }: AttendanceLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="month" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="present" 
          name="Present"
          stroke="hsl(var(--success))" 
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--success))', strokeWidth: 2 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="late" 
          name="Late"
          stroke="hsl(var(--warning))" 
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--warning))', strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="absent" 
          name="Absent"
          stroke="hsl(var(--destructive))" 
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
