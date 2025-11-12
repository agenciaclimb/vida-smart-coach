import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const Bar = () => (
  <div className="space-y-2">
    <div className="flex justify-between">
      <div className="h-4 w-24 bg-gray-200 rounded" />
      <div className="h-4 w-16 bg-gray-200 rounded" />
    </div>
    <div className="h-2 w-full bg-gray-200 rounded" />
  </div>
);

const WeeklySummarySkeleton = () => {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
        <CardDescription className="h-4 w-56 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-4 animate-pulse">
        <Bar />
        <Bar />
        <Bar />
        <Bar />
        <div className="pt-4 border-t mt-4 space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-6 w-12 bg-gray-200 rounded" />
          </div>
          <div className="h-3 w-full bg-gray-200 rounded" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklySummarySkeleton;
