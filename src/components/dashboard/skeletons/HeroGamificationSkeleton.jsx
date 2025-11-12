import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const HeroGamificationSkeleton = () => {
  return (
    <Card className="overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 shadow-xl animate-pulse">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="h-8 w-48 bg-white/40 rounded mb-2" />
            <div className="h-4 w-24 bg-white/30 rounded" />
          </div>
          <div className="h-8 w-28 bg-white/40 rounded" />
        </div>
        <div className="h-3 w-full bg-white/40 rounded" />
        <div className="flex gap-4 mt-4">
          <div className="h-14 w-36 bg-white/40 rounded" />
          <div className="h-14 w-36 bg-white/30 rounded" />
        </div>
      </CardContent>
    </Card>
  );
};

export default HeroGamificationSkeleton;
