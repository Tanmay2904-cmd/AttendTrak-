import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MonthlyAttendance } from '@/types';

interface AttendanceBarChartProps {
  data: MonthlyAttendance[];
}

export function AttendanceBarChart({ data }: AttendanceBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Legend />
        <Bar 
          dataKey="present" 
          name="Present"
          fill="hsl(var(--success))" 
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="late" 
          name="Late"
          fill="hsl(var(--warning))" 
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="absent" 
          name="Absent"
          fill="hsl(var(--destructive))" 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
