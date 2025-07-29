'use client';

import type { TrainingVideo } from '@/lib/data/training-videos';
import type { EmployeeTrainingVideoCompletion, Member, Policy, User } from '@trycompai/db';
import type { FleetPolicy, Host } from '../../devices/types';
import { EmployeeDetails } from './EmployeeDetails';
import { EmployeeTasks } from './EmployeeTasks';

interface EmployeeDetailsProps {
  employee: Member & {
    user: User;
  };
  policies: Policy[];
  trainingVideos: (EmployeeTrainingVideoCompletion & {
    metadata: TrainingVideo;
  })[];
  fleetPolicies: FleetPolicy[];
  host: Host;
  isFleetEnabled: boolean;
}

export function Employee({
  employee,
  policies,
  trainingVideos,
  fleetPolicies,
  host,
  isFleetEnabled,
}: EmployeeDetailsProps) {
  return (
    <div className="flex flex-col gap-4">
      <EmployeeDetails employee={employee} />
      <EmployeeTasks
        employee={employee}
        policies={policies}
        trainingVideos={trainingVideos}
        fleetPolicies={fleetPolicies}
        host={host}
        isFleetEnabled={isFleetEnabled}
      />
    </div>
  );
}
