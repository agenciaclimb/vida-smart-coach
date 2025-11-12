import React from 'react';

const ActionCardsSkeleton = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-32 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 shadow" />
      ))}
    </div>
  );
};

export default ActionCardsSkeleton;
