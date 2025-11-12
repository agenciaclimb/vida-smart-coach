import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const CheckinCTASkeleton = () => {
  return (
    <Card className="border-2 shadow-lg animate-pulse">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="h-5 w-40 bg-gray-200 rounded" />
          <div className="h-6 w-20 bg-gray-200 rounded" />
        </div>
        <CardDescription className="h-4 w-64 bg-gray-200 rounded mt-2" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
        <div className="h-10 bg-gray-200 rounded mt-4" />
      </CardContent>
    </Card>
  );
};

export default CheckinCTASkeleton;
