"use server";

import { db } from "@comp/db";
import { cache } from "react";
import type { FrameworkInstanceWithControls } from "../types";

export const getSingleFrameworkInstanceWithControls = cache(
	async ({
		organizationId,
		frameworkInstanceId,
	}: {
		organizationId: string;
		frameworkInstanceId: string;
	}): Promise<FrameworkInstanceWithControls | null> => {
		const frameworkInstance = await db.frameworkInstance.findUnique({
			where: {
				organizationId,
				id: frameworkInstanceId,
			},
			include: {
				controls: {
					include: {
						artifacts: {
							include: {
								policy: true,
								evidence: true,
							},
						},
						requirementsMapped: true,
					},
				},
			},
		});

		return frameworkInstance;
	},
);
