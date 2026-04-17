"use client";

import { useEffect, useState } from "react";
import { LinkCheckerJob } from "@/src/types/link-checker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, CirclePause, CirclePlay, CircleDashed} from "lucide-react";
import Link from "next/link";
import { useAnimatedNumber } from "@/src/hooks/useAnimatedNumber";
import { formatDisplayUrlParts } from "@/src/formatDisplayUrl";

type LinkCheckerCardProps = {
	job: LinkCheckerJob;
	handleDelete: (jobId: number) => Promise<void> | void;
	handlePause: (jobId: number) => Promise<void> | void;
	handleResume: (jobId: number) => Promise<void> | void;
	actionState?: "pause" | "resume";
};

function formatStatus(status: LinkCheckerJob["job_status"]) {
	switch (status) {
		case "pending":
			return "Pending";
		case "paused":
			return "Paused";
		case "resuming":
			return "Resuming";
		case "working":
			return "Working";
		case "finished":
			return "Finished";
		case "error":
			return "Error";
		default:
			return status;
		}
}

function getStatusBadgeVariant(status: LinkCheckerJob["job_status"]) {
	switch (status) {
		case "finished":
			return "default";
		case "pending":
		case "working":
		case "paused":
		case "resuming":
			return "secondary";
		case "error":
			return "destructive";
		default:
			return "secondary";
	}
}

function StatusIcon({ status }: { status: LinkCheckerJob["job_status"] }) {
	if (status === "pending") {
		return <CircleDashed className="h-4 w-4 animate-spin"/>
	}

	if (status === "paused") {
		return <CirclePause className="h-4 w-4"/>
	}

	if (status === "resuming") {
		return <CirclePlay className="h-4 w-4"/>
	}

	if (status === "working") {
		return <Loader2 className="h-4 w-4 animate-spin" />;
	}

	if (status === "finished") {
		return <CheckCircle2 className="h-4 w-4" />;
	}

	return <XCircle className="h-4 w-4" />;
}

export default function LinkCheckerCard({
  job,
  handleDelete,
  handlePause,
  handleResume,
  actionState,
}: LinkCheckerCardProps) {
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const isPausing = actionState === "pause";
	const isResuming = actionState === "resume";
	const isMutating = isPausing || isResuming || isDeleting;

	const detailHref = `/tools/link-checker/${job.id}`;

	const canViewResults = job.job_status === "finished" || job.job_status === "error";
	const canDelete = job.job_status === "finished" || job.job_status === "error" || job.job_status === "paused";
	const canPause = job.job_status === "pending" || job.job_status === "working";
	const canResume = job.job_status === "paused"

	const pagesFound = job.data.jobPreview.discoverCount;
	const animatedPagesFound = useAnimatedNumber(pagesFound, 1000);

	const linksFound = job.data.jobPreview.linkCount;
	const animatedLinksFound = useAnimatedNumber(linksFound, 1000);

	const urlData = formatDisplayUrlParts(job.data.baseUrl)
	const formattedUrlData = urlData.host + urlData.fullPath

	useEffect(() => {
		if (!isConfirmingDelete) return;

		const timeoutId = setTimeout(() => {
		setIsConfirmingDelete(false);
		}, 5000);

		return () => clearTimeout(timeoutId);
	}, [isConfirmingDelete]);

	async function onDeleteClick() {
		if (!canDelete || isDeleting) return;

		if (!isConfirmingDelete) {
		setIsConfirmingDelete(true);
		return;
		}

		try {
		setIsDeleting(true);
		await handleDelete(job.id);
		} finally {
		setIsDeleting(false);
		setIsConfirmingDelete(false);
		}
	}

  return (
    <div className="card flex w-full max-w-[320px] flex-col gap-5">
		<div className="space-y-3">
			<div className="min-h-21 space-y-1">
				<p className="text-sm font-medium text-muted-foreground">Base URL</p>
				<h3 className="h-18 line-clamp-3 wrap-break-word text-base font-semibold leading-6 text-zinc-900">
					{formattedUrlData}
				</h3>
				</div>

				<div className="flex items-center gap-2">
				<StatusIcon status={job.job_status} />
				<Badge variant={getStatusBadgeVariant(job.job_status)}>
					{formatStatus(job.job_status)}
				</Badge>
			</div>
		</div>

		<div className="grid grid-cols-2 gap-3">
			<div className="flex flex-col justify-center gap-3">
				<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
					<p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
					Pages found
					</p>
					<p className="mt-1 text-2xl font-semibold text-zinc-900">
					{animatedPagesFound}
					</p>
				</div>

				{canViewResults ? (
				<Button asChild>
					<Link href={detailHref}>View results</Link>
				</Button>
				) : isPausing ? (
				<Button variant="secondary" disabled>
					Pausing...
				</Button>
				) : isResuming ? (
				<Button variant="secondary" disabled>
					Resuming...
				</Button>
				) : canPause ? (
				<Button variant="secondary" onClick={() => handlePause(job.id)}>
					Pause
				</Button>
				) : canResume ? (
				<Button variant="secondary" onClick={() => handleResume(job.id)}>
					Resume
				</Button>
				) : (
				<Button variant="secondary" disabled>
					Please wait
				</Button>
				)}
			</div>

			<div className="flex flex-col justify-center gap-3">
				<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
					<p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
					Links found
					</p>
					<p className="mt-1 text-2xl font-semibold text-zinc-900">
					{animatedLinksFound}
					</p>
				</div>

				<Button
					variant="destructive"
					onClick={onDeleteClick}
					disabled={!canDelete || isDeleting}
				>
					{isDeleting
					? "Deleting.."
					: isConfirmingDelete
					? "Confirm delete"
					: canDelete
					? "Delete"
					: "Please wait"}
				</Button>
			</div>
		</div>
    </div>
  );
}