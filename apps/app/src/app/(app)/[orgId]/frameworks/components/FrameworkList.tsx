'use client';

import { Control, Task } from '@db';
import type { FrameworkInstanceWithControls } from '../types';
import { FrameworkCard } from './FrameworkCard';

export function FrameworkList({
  frameworksWithControls,
  tasks,
}: {
  frameworksWithControls: FrameworkInstanceWithControls[];
  tasks: (Task & { controls: Control[] })[];
}) {
  if (!frameworksWithControls.length) return null;

  return (
    <div className="space-y-6">
      {frameworksWithControls.map((frameworkInstance) => (
        <FrameworkCard
          key={frameworkInstance.id}
          frameworkInstance={frameworkInstance}
          complianceScore={0}
          tasks={tasks}
        />
      ))}
    </div>
  );
}
