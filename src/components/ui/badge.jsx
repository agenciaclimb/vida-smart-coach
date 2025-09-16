import * as React from "react";

// Simple badge variants without class-variance-authority for build compatibility
const badgeVariants = {
  default: "inline-flex items-center rounded-full border border-transparent bg-blue-600 text-white px-2.5 py-0.5 text-xs font-semibold transition-colors hover:bg-blue-500",
  secondary: "inline-flex items-center rounded-full border border-transparent bg-gray-100 text-gray-900 px-2.5 py-0.5 text-xs font-semibold transition-colors hover:bg-gray-200",
  destructive: "inline-flex items-center rounded-full border border-transparent bg-red-600 text-white px-2.5 py-0.5 text-xs font-semibold transition-colors hover:bg-red-500",
  outline: "inline-flex items-center rounded-full border border-gray-300 text-gray-900 px-2.5 py-0.5 text-xs font-semibold transition-colors hover:bg-gray-50",
  success: "inline-flex items-center rounded-full border border-transparent bg-green-600 text-white px-2.5 py-0.5 text-xs font-semibold transition-colors hover:bg-green-500",
  warning: "inline-flex items-center rounded-full border border-transparent bg-yellow-500 text-white px-2.5 py-0.5 text-xs font-semibold transition-colors hover:bg-yellow-400"
};

function Badge({ className = "", variant = "default", ...props }) {
  const variantClass = badgeVariants[variant] || badgeVariants.default;
  const finalClassName = `${variantClass} ${className}`.trim();
  
  return (
    <div className={finalClassName} {...props} />
  );
}

export { Badge, badgeVariants };