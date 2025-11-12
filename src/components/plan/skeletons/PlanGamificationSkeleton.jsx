import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const PlanGamificationSkeleton = () => {
  return (
    <Card className="bg-gradient-to-r from-gray-200 to-gray-300 border-0 animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-white/40 rounded"></div>
          <div className="h-4 bg-white/40 rounded w-48"></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-center space-y-1">
              <div className="h-8 bg-white/40 rounded w-12 mx-auto"></div>
              <div className="h-3 bg-white/30 rounded w-12"></div>
            </div>
            <div className="text-center space-y-1">
              <div className="h-8 bg-white/40 rounded w-12 mx-auto"></div>
              <div className="h-3 bg-white/30 rounded w-12"></div>
            </div>
            <div className="text-center space-y-1">
              <div className="h-8 bg-white/40 rounded w-12 mx-auto"></div>
              <div className="h-3 bg-white/30 rounded w-12"></div>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <div className="h-3 bg-white/30 rounded w-32"></div>
            <div className="h-3 bg-white/30 rounded w-12"></div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2"></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanGamificationSkeleton;
