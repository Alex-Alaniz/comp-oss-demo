import React from "react";
import { cn } from "@comp/ui/cn";
import { Button } from "@comp/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@comp/ui/alert-dialog";
import type { Attachment, AttachmentType } from "@comp/db/types";
import { getAttachmentIconAndColor } from "../utils/attachmentUtils";

interface PendingAttachment {
	id: string;
	name: string;
	fileType: string;
}

interface AttachmentItemProps {
	attachment?: Attachment;
	pendingAttachment?: PendingAttachment;

	onClickFilename?: (attachmentId: string) => void;
	onDelete: (attachmentId: string) => void;

	isBusy?: boolean;
	isParentBusy?: boolean;

	className?: string;
	// Prop to control whether the delete button is shown
	canDelete?: boolean;
}

function mapFileTypeToAttachmentType(fileType: string): AttachmentType {
	const type = fileType.split("/")[0];
	switch (type) {
		case "image":
			return "image" as AttachmentType;
		case "video":
			return "video" as AttachmentType;
		case "audio":
			return "audio" as AttachmentType;
		case "application":
			if (fileType === "application/pdf") return "document" as AttachmentType;
			return "document" as AttachmentType;
		default:
			return "other" as AttachmentType;
	}
}

export function AttachmentItem({
	attachment,
	pendingAttachment,
	onClickFilename,
	onDelete,
	isBusy = false,
	isParentBusy = false,
	className,
	canDelete = true, // Default to true if not provided
}: AttachmentItemProps) {
	const isExisting = !!attachment;
	const id = attachment?.id ?? pendingAttachment?.id ?? "";
	const name = attachment?.name ?? pendingAttachment?.name ?? "";
	const type =
		attachment?.type ??
		mapFileTypeToAttachmentType(pendingAttachment?.fileType ?? "");

	const { Icon, colorClass } = getAttachmentIconAndColor(type);

	const handleDelete = () => {
		if (id) {
			onDelete(id);
		}
	};

	const handleFilenameClick = () => {
		if (onClickFilename && id) {
			onClickFilename(id);
		}
	};

	const isDisabled = isBusy || isParentBusy;

	return (
		<div
			key={id}
			className={cn(
				"flex items-center justify-between gap-2 rounded-md border p-2 text-base bg-background",
				className,
			)}
		>
			<div className="flex items-center gap-2 flex-1 min-w-0">
				{isBusy ? (
					<Loader2
						className={cn("h-4 w-4 animate-spin shrink-0", colorClass)}
					/>
				) : (
					<Icon className={cn("h-4 w-4 shrink-0", colorClass)} />
				)}

				{onClickFilename ? (
					<button
						type="button"
						onClick={handleFilenameClick}
						disabled={isDisabled}
						className="truncate text-left p-0 h-auto bg-transparent hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
						title={name}
					>
						{name}
					</button>
				) : (
					<span className="truncate" title={name}>
						{name}
					</span>
				)}
			</div>

			{/* Only render the delete button/dialog if canDelete is true */}
			{canDelete && (
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 disabled:opacity-50"
							disabled={isDisabled}
							aria-label={`Remove attachment ${name}`}
						>
							{isBusy ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Trash2 className="h-4 w-4" />
							)}
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you sure?</AlertDialogTitle>
							<AlertDialogDescription>
								{isExisting
									? "This action cannot be undone. This will permanently delete the attachment."
									: "This will remove the attachment from your pending list. It won't be included when you submit."}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={handleDelete} disabled={isBusy}>
								{isBusy ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								Remove
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</div>
	);
}
