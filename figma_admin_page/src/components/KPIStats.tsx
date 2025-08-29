import React from 'react';
import { Card } from './ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPIStatsProps {
  onDrilldown: (type: string) => void;
}

export function KPIStats({ onDrilldown }: KPIStatsProps) {
  const stats = [
    {
      label: 'Anwesend',
      value: 317,
      trend: 'up',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      type: 'anwesend'
    },
    {
      label: 'Ausstehend',
      value: 23,
      trend: 'down',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      type: 'ausstehend'
    },
    {
      label: 'Entschuldigt',
      value: 8,
      trend: 'stable',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      type: 'entschuldigt'
    },
    {
      label: 'Unentschuldigt',
      value: 2,
      trend: 'up',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      type: 'unentschuldigt'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />;
      case 'down':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <Card 
          key={stat.type}
          className="p-4 cursor-pointer hover:shadow-sm transition-shadow"
          onClick={() => onDrilldown(stat.type)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className={`text-2xl font-medium ${stat.color}`}>{stat.value}</p>
            </div>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <div className={stat.color}>
                {getTrendIcon(stat.trend)}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}