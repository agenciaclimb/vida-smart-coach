import { useState, useEffect } from 'react';

export const useGamification = () => {
  const [gamificationData, setGamificationData] = useState({
    totalPoints: 0,
    level: 1
  });
  const [loading, setLoading] = useState(false);

  const addPoints = () => {
    return true;
  };

  return {
    gamificationData,
    loading,
    addPoints
  };
};