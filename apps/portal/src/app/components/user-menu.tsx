import { getI18n } from "@/app/locales/server";
import { Avatar, AvatarFallback, AvatarImageNext } from "@comp/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@comp/ui/dropdown-menu";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { LocaleSwitch } from "./locale-switch";
import { Logout } from "./logout";
import { ThemeSwitch } from "./theme-switch";

// Helper function to get initials
function getInitials(name?: string | null, email?: string | null): string {
	if (name) {
		const names = name.split(' ');
		const firstInitial = names[0]?.charAt(0) ?? "";
		const lastInitial = names.length > 1 ? names[names.length - 1]?.charAt(0) : "";
		const initials = `${firstInitial}${lastInitial}`.toUpperCase();
		// Ensure we return something, even if splitting/chartAt fails unexpectedly
		return initials || "?";
	}
	if (email) {
		// Use first letter of email if name is missing
		return email.charAt(0).toUpperCase();
	}
	// Fallback if both name and email are missing
	return "?";
}

export async function UserMenu() {
	const t = await getI18n();

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	const userInitials = getInitials(session?.user?.name, session?.user?.email);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Avatar className="rounded-full w-8 h-8 cursor-pointer">
					{session?.user?.image && (
						<AvatarImageNext
							src={session.user.image}
							alt={session?.user?.name ?? "User Avatar"}
							width={32}
							height={32}
							quality={100}
						/>
					)}
					<AvatarFallback>
						<span className="text-xs font-semibold">
							{userInitials}
						</span>
					</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-[240px]" sideOffset={10} align="end">
				{" "}
				<DropdownMenuLabel>
					<div className="flex justify-between items-center">
						<div className="flex flex-col">
							<span className="truncate line-clamp-1 max-w-[155px] block">
								{session?.user?.name}
							</span>
							<span className="truncate text-xs text-muted-foreground font-normal">
								{session?.user?.email}
							</span>
						</div>
						<div className="border py-0.5 px-3 rounded-full text-[11px] font-normal">
							Beta
						</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<div className="flex flex-row justify-between items-center p-2">
					<p className="text-base">{t("user_menu.theme")}</p>
					<ThemeSwitch />
				</div>{" "}
				<DropdownMenuSeparator />{" "}
				<div className="flex flex-row justify-between items-center p-2">
					<p className="text-base">{t("user_menu.language")}</p>
					<LocaleSwitch />
				</div>{" "}
				<DropdownMenuSeparator />
				<Logout />
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
