import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Bot } from 'lucide-react';

const ChatSkeleton = () => {
  return (
    <Card className="flex flex-col flex-grow shadow-lg rounded-2xl overflow-hidden h-[calc(100vh-200px)]">
      {/* Header Skeleton */}
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 animate-pulse" />
          <div className="h-6 w-32 bg-white/30 rounded animate-pulse" />
        </div>
      </CardHeader>

      {/* Messages Skeleton */}
      <CardContent className="flex-grow p-4 space-y-4">
        {/* AI Message Skeleton */}
        <div className="flex justify-start">
          <div className="max-w-[70%] space-y-2">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* User Message Skeleton */}
        <div className="flex justify-end">
          <div className="max-w-[70%] space-y-2">
            <div className="h-4 w-56 bg-blue-200 rounded animate-pulse" />
            <div className="h-4 w-44 bg-blue-200 rounded animate-pulse" />
          </div>
        </div>

        {/* AI Message Skeleton */}
        <div className="flex justify-start">
          <div className="max-w-[70%] space-y-2">
            <div className="h-4 w-52 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-60 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* User Message Skeleton */}
        <div className="flex justify-end">
          <div className="max-w-[70%] space-y-2">
            <div className="h-4 w-40 bg-blue-200 rounded animate-pulse" />
          </div>
        </div>

        {/* AI Typing Indicator */}
        <div className="flex justify-start">
          <div className="max-w-[70%] p-3 rounded-lg bg-gray-200 flex items-center gap-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </CardContent>

      {/* Input Skeleton */}
      <CardFooter className="p-4 border-t bg-gray-50">
        <div className="flex w-full space-x-2">
          <div className="flex-grow h-10 bg-gray-200 rounded animate-pulse" />
          <div className="w-10 h-10 bg-gray-300 rounded animate-pulse" />
        </div>
      </CardFooter>
    </Card>
  );
};

export default ChatSkeleton;
