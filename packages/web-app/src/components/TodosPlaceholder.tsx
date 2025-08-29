import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { DebugOverlay } from '../debug';
import { CheckSquare } from 'lucide-react';

export function TodosPlaceholder() {
  return (
    <DebugOverlay name="TodosPlaceholder">
      <Card className="h-full relative overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Todos
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground transform -rotate-12 bg-muted/50 px-4 py-2 rounded-lg border-2 border-dashed border-muted-foreground/30">
            <p className="text-sm font-medium">siehe Lehrkräfte-Dashboard</p>
          </div>
        </div>
        <div className="opacity-20 space-y-3">
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </CardContent>
      </Card>
    </DebugOverlay>
  );
}
