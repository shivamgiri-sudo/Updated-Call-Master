// frontend/src/components/ui/Badge.tsx
import React from "react";

export interface BadgeProps {
  variant?: 'default' | 'critical' | 'high' | 'medium' | 'low' | 'disabled' |
            'p0' | 'p1' | 'fail' | 'gap' | 'pending' | 'watch' | 'delayed' |
            'partial' | 'info' | 'pilot' | 'demo' | 'pass' | 'active' | 'healthy' |
            'valid' | 'enabled' | 'controlled';
  children: React.ReactNode;
}

export default function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span className={`badge ${variant}`} role="status">
      {children}
    </span>
  );
}
