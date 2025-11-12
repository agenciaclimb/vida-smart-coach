import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const PlanWorkoutsSkeleton = () => {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-48 mt-1"></div>
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-40"></div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PlanWorkoutsSkeleton;
