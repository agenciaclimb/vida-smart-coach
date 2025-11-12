import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const PlanHeaderSkeleton = () => {
  return (
    <Card className="bg-gradient-to-br from-gray-200 to-gray-300 border-0 shadow-xl animate-pulse">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/40 rounded-xl w-14 h-14"></div>
            <div className="space-y-2">
              <div className="h-6 bg-white/40 rounded w-48"></div>
              <div className="h-4 bg-white/30 rounded w-64"></div>
            </div>
          </div>
          <div className="h-9 bg-white/40 rounded w-32"></div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default PlanHeaderSkeleton;
