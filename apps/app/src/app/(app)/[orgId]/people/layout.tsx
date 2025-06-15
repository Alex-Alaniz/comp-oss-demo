import { AppOnboarding } from "@/components/app-onboarding";
import { auth } from "@/utils/auth";
import { db } from "@comp/db";
import { SecondaryMenu } from "@comp/ui/secondary-menu";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	const orgId = session?.session.activeOrganizationId;

	if (!orgId) {
		return redirect("/");
	}

	// Fetch all members first
	const allMembers = await db.member.findMany({
		where: {
			organizationId: orgId,
		},
	});

	const employees = allMembers.filter((member) => {
		const roles = member.role.includes(",")
			? member.role.split(",")
			: [member.role];
		return roles.includes("employee");
	});

	const isFleetEnabled = process.env.NEXT_PUBLIC_FLEET_ENABLED === "true";

	return (
		<div className="max-w-[1200px] m-auto">
			<SecondaryMenu
				items={[
					{
						path: `/${orgId}/people/all`,
						label: "People",
					},
					...(employees.length > 0
						? [
								{
									path: `/${orgId}/people/dashboard`,
									label: "Employee Tasks",
								},
							]
						: []),
					...(isFleetEnabled
						? [
								{
									path: `/${orgId}/people/devices`,
									label: "Employee Devices",
								},
							]
						: []),
						]}
			/>

			<main className="mt-4">{children}</main>
		</div>
	);
}
