"use client";

import { Badge } from "@comp/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@comp/ui/card";
import { Progress } from "@comp/ui/progress";
import { getControlStatus } from "../../lib/utils";
import { FrameworkInstanceWithControls } from "../../types";
import { Task } from "@comp/db/types";

interface FrameworkOverviewProps {
	frameworkInstanceWithControls: FrameworkInstanceWithControls;
	tasks: Task[];
}

export function FrameworkOverview({
	frameworkInstanceWithControls,
	tasks,
}: FrameworkOverviewProps) {
	// Get all controls from all requirements
	const allControls = frameworkInstanceWithControls.controls;
	const totalControls = allControls.length;

	// Calculate compliant controls (all artifacts completed)
	const compliantControls = allControls.filter(
		(control) =>
			getControlStatus(control.artifacts, tasks, control.id) ===
			"completed",
	).length;

	// Calculate compliance percentage based on compliant controls
	const compliancePercentage =
		totalControls > 0
			? Math.round((compliantControls / totalControls) * 100)
			: 0;

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>
						{frameworkInstanceWithControls.framework.name}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						{frameworkInstanceWithControls.framework.description}
						{" "}
					</p>
					<div className="mt-4">
						<Badge variant="outline">
							Framework ID:{" "}
							{frameworkInstanceWithControls.frameworkId}
						</Badge>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Compliance Progress</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-2">
						<Progress value={compliancePercentage} />
						<p className="text-sm text-muted-foreground">
							{compliantControls} of {totalControls} controls
							compliant
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
