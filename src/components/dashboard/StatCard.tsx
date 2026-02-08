import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'danger' | 'warning';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
}: StatCardProps) {
  const variantClasses = {
    default: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    danger: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
  };

  const iconClasses = {
    default: 'text-blue-600',
    success: 'text-green-600',
    danger: 'text-red-600',
    warning: 'text-yellow-600',
  };

  return (
    <Card className={cn('border', variantClasses[variant])}>
      <CardContent className="p-3 md:p-4 lg:p-6">
        {/* Icon */}
        <div className="flex items-start justify-between mb-2 md:mb-3">
          <Icon className={cn('w-5 h-5 md:w-6 md:h-6', iconClasses[variant])} />
        </div>

        {/* Content */}
        <div className="space-y-1">
          {/* Title - responsive font size */}
          <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">
            {title}
          </p>

          {/* Value - responsive font size */}
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
            {value}
          </h3>

          {/* Subtitle - if exists */}
          {subtitle && (
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}