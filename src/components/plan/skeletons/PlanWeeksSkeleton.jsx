import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const PlanWeeksSkeleton = () => {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-5 bg-gray-200 rounded w-40"></div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded flex-1 min-w-[100px]"></div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanWeeksSkeleton;
