'use client';

import { Badge } from '@comp/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@comp/ui/card';
import { cn } from '@comp/ui/cn';
import { Progress } from '@comp/ui/progress';
import type { Control, Task } from '@db';
import { BarChart3, Clock } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { FrameworkInstanceWithControls } from '../types';

interface FrameworkCardProps {
  frameworkInstance: FrameworkInstanceWithControls;
  complianceScore?: number;
  tasks: (Task & { controls: Control[] })[];
}

export function FrameworkCard({
  frameworkInstance,
  complianceScore = 0,
  tasks,
}: FrameworkCardProps) {
  const { orgId } = useParams<{ orgId: string }>();

  const getStatusBadge = (score: number) => {
    if (score >= 95)
      return {
        label: 'Compliant',
        variant: 'default' as const,
      };
    if (score >= 80)
      return {
        label: 'Nearly Compliant',
        variant: 'secondary' as const,
      };
    if (score >= 50)
      return {
        label: 'In Progress',
        variant: 'outline' as const,
      };
    return {
      label: 'Needs Attention',
      variant: 'destructive' as const,
    };
  };

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const controlsCount = frameworkInstance.controls?.length || 0;
  // Policies breakdown
  const frameworkControlIds = frameworkInstance.controls?.map((c) => c.id) || [];
  const allPolicies =
    frameworkInstance.controls?.flatMap((control) => control.policies || []) || [];
  const uniquePoliciesMap = new Map<string, { id: string; status: string }>();
  for (const p of allPolicies) uniquePoliciesMap.set(p.id, p);
  const uniquePolicies = Array.from(uniquePoliciesMap.values());
  const totalPolicies = uniquePolicies.length;
  const publishedPolicies = uniquePolicies.filter((p) => p.status === 'published').length;

  // Calculate not started controls: controls where all policies are draft or non-existent AND all tasks are todo or non-existent
  const notStartedControlsCount =
    frameworkInstance.controls?.filter((control) => {
      // If a control has no policies and no tasks, it's not started.
      const controlTasks = tasks.filter((task) => task.controls.some((c) => c.id === control.id));

      if ((!control.policies || control.policies.length === 0) && controlTasks.length === 0) {
        return true;
      }

      // Check if ALL policies are in draft state or non-existent
      const policiesNotStarted =
        !control.policies ||
        control.policies.length === 0 ||
        control.policies.every((policy) => policy.status === 'draft');

      // Check if ALL tasks are in todo state or there are no tasks
      const tasksNotStarted =
        controlTasks.length === 0 || controlTasks.every((task) => task.status === 'todo');

      return policiesNotStarted && tasksNotStarted;
      // If either any policy is not draft or any task is not todo, it's in progress
    }).length || 0;

  // Tasks breakdown for this framework (tasks associated with its controls)
  const frameworkTasks = tasks.filter((task) =>
    task.controls.some((c) => frameworkControlIds.includes(c.id)),
  );
  const totalTasks = frameworkTasks.length;
  const doneTasks = frameworkTasks.filter((t) => t.status === 'done').length;

  // Use direct framework data:
  const frameworkDetails = frameworkInstance.framework;
  const statusBadge = getStatusBadge(complianceScore);

  // Calculate last activity date - use current date as fallback
  const lastActivityDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });

  return (
    <Link href={`/${orgId}/frameworks/${frameworkInstance.id}`} className="group block">
      <Card className="flex h-full flex-col transition-shadow hover:shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="mb-1 truncate text-base font-medium">
                {frameworkDetails.name}
              </CardTitle>
              <p className="text-muted-foreground line-clamp-2 text-xs">
                {frameworkDetails.description}
              </p>
            </div>
            <Badge variant={statusBadge.variant} className="shrink-0 text-xs">
              {complianceScore}%
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-4 pt-0">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <BarChart3 className="text-muted-foreground h-3 w-3" />
                <span className="text-muted-foreground">Progress</span>
              </div>
              <span className={cn('font-medium tabular-nums', getComplianceColor(complianceScore))}>
                {complianceScore}%
              </span>
            </div>
            <Progress value={complianceScore} className="h-1" />
          </div>

          {/* Breakdown */}
          <div className="text-muted-foreground space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span>Policies</span>
              <span className="tabular-nums">
                {publishedPolicies}/{totalPolicies} published
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tasks</span>
              <span className="tabular-nums">
                {doneTasks}/{totalTasks} done
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Controls</span>
              <span className="tabular-nums">{controlsCount} total</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-muted-foreground flex items-center border-t pt-2 text-xs">
            <Clock className="mr-1 h-3 w-3" />
            <span>Updated {lastActivityDate}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
