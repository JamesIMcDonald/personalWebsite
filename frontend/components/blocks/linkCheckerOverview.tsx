"use client";

import { Button } from "@/components/ui/button";
import SignInWithGoogle from "@/components/ui/signInWithGoogle";
import { apiGet, apiDelete } from "@/src/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import LinkCheckerCard from "@/components/previewCards/linkCheckerCard";
import NewLinkCheckerJobForm from "@/components/jobForms/linkCheckerForm";
import { LinkCheckerJob } from "@/src/types/link-checker";
import { useAnimatedNumber } from "@/src/hooks/useAnimatedNumber";
import { useAuth } from "@/src/providers/AuthProvider"
import { Suspense } from "react";


const POLL_MS = 5000;
const ACTIVE_STATUSES = new Set(["pending", "working", "resuming"]);

export default function LinkCheckerComponent() {
	const [jobs, setJobs] = useState<LinkCheckerJob[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [jobActionById, setJobActionById] = useState<Record<number, "pause" | "resume" | undefined>>({});
	const [showNewJobForm, setShowNewJobForm] = useState(false);
	const { auth } = useAuth()
	const hasActiveJobs = useMemo(
		() =>
		jobs.some((job) =>
			ACTIVE_STATUSES.has(job.job_status?.toLowerCase?.() ?? "")
		),
		[jobs]
	);

	const loadData = useCallback(async (): Promise<LinkCheckerJob[] | null> => {
		try {
		const res = await apiGet("/link-checker");

		if (!res.ok) {
			console.error("Request failed:", res.status);
			setError(`Request failed: ${res.status}`);
			return null;
		}

		const json: LinkCheckerJob[] = await res.json();
		setJobs(json);
		setError(null);
		return json;
		} catch (err) {
		console.error("Error loading data:", err);
		setError("Failed to load jobs.");
		return null;
		}
	}, []);

	// Initial load
	useEffect(() => {
		loadData();
	}, [loadData]);

	// Poll only while there are active jobs
	useEffect(() => {
		if (!hasActiveJobs) return;

		let cancelled = false;
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		const poll = async () => {
		if (cancelled) return;

		await loadData();

		if (cancelled) return;
		timeoutId = setTimeout(poll, POLL_MS);
		};

		timeoutId = setTimeout(poll, POLL_MS);

		return () => {
		cancelled = true;
		if (timeoutId) clearTimeout(timeoutId);
		};
	}, [hasActiveJobs, loadData]);

	const handleDelete = useCallback(async (jobId: number) => {
		setError(null);

		try {
		// Adjust this path to match your real API route
		const res = await apiDelete(`/link-checker/${jobId}`);

		if (!res.ok) {
			const body = await res.json().catch(() => null);
			setError(body?.error || "Failed to delete job.");
			return;
		}

		setJobs((prev) => prev.filter((job) => job.id !== jobId));
		} catch (err) {
		console.error("Error deleting job:", err);
		setError("Something went wrong deleting the job.");
		}
	}, []);

	const handlePause = useCallback(async (jobId: number) => {
		setError(null);
		setJobActionById((prev) => ({ ...prev, [jobId]: "pause" }));

		try {
			const res = await apiGet(`/link-checker/${jobId}/pause`);

			if (!res.ok) {
			const body = await res.json().catch(() => null);
			setError(body?.error || "Failed to pause job.");
			return;
			}

			// optimistic local update
			setJobs((prev) =>
			prev.map((job) =>
				job.id === jobId ? { ...job, job_status: "paused" } : job
			)
			);

			await loadData();
		} catch (err) {
			console.error("Error pausing job:", err);
			setError("Something went wrong pausing the job.");
		} finally {
			setJobActionById((prev) => ({ ...prev, [jobId]: undefined }));
		}
		}, [loadData]);

	const handleResume = useCallback(async (jobId: number) => {
		setError(null);
		setJobActionById((prev) => ({ ...prev, [jobId]: "resume" }));

		try {
			const res = await apiGet(`/link-checker/${jobId}/resume`);

			if (!res.ok) {
			const body = await res.json().catch(() => null);
			setError(body?.error || "Failed to resume job.");
			return;
			}

			// optimistic local update
			setJobs((prev) =>
			prev.map((job) =>
				job.id === jobId ? { ...job, job_status: "resuming" } : job
			)
			);

			await loadData();
		} catch (err) {
			console.error("Error resuming job:", err);
			setError("Something went wrong resuming the job.");
		} finally {
			setJobActionById((prev) => ({ ...prev, [jobId]: undefined }));
		}
	}, [loadData]);

	const totalJobs = jobs.length;
	const animatedTotalJobs = useAnimatedNumber(totalJobs, 1000)

	const totalPagesDiscovered = useMemo(() => jobs.reduce((sum, job) => sum + (job.data?.jobPreview?.discoverCount ?? 0), 0), [jobs]);
	const animatedTotalPagesDiscovered = useAnimatedNumber(totalPagesDiscovered, 1000)

	const totalPagesCrawled = useMemo(() => jobs.reduce((sum, job) => sum + (job.data?.jobPreview?.crawlCount ?? 0), 0), [jobs]);
	const animatedTotalPagesCrawled = useAnimatedNumber(totalPagesCrawled, 1000)

	const totalLinksFound = useMemo(() => jobs.reduce((sum, job) => sum + (job.data?.jobPreview?.linkCount ?? 0), 0), [jobs]);
	const animatedTotalLinksFound = useAnimatedNumber(totalLinksFound, 1000)

	return (
	<div>
		{ auth.status === "logged-in" ? (
		<div className="mx-auto max-w-6xl space-y-4 p-4">


			<div>
				<div className="flex flex-wrap justify-center items-center gap-4" hidden={showNewJobForm}>
					<div className="stat-box">Jobs Run: {animatedTotalJobs}</div>
					<div className="stat-box">Pages Crawled: {animatedTotalPagesCrawled}</div>
					<div className="stat-box">Pages Found: {animatedTotalPagesDiscovered}</div>
					<div className="stat-box">Links Found: {animatedTotalLinksFound}</div>
					<Button onClick={() => setShowNewJobForm((prev) => !prev)}>New job</Button>
				</div>

				{showNewJobForm ? (
				<NewLinkCheckerJobForm
					onCreated={async () => {
					await loadData();
					}}
					onCancel={() => setShowNewJobForm(false)}
				/>
				) : null}
			</div>

			<div className="flex flex-wrap justify-center gap-4">
				{jobs.length > 0 ? (
				jobs.map((job) => 
				<LinkCheckerCard 
					key={job.id} 
					job={job} 
					handleDelete={handleDelete} 
					handlePause={handlePause} 
					handleResume={handleResume}
					actionState={jobActionById[job.id]}
				/>)
				) : error ? (
				<p>{error}</p>
				) : (
				<p>No jobs yet.</p>
				)}
			</div>
		</div>				
		) : (
		<div className="card mx-auto flex min-h-40 max-w-6xl flex-col justify-center gap-4 bg-linear-to-br from-zinc-200 to-zinc-500 p-6 text-zinc-950">
			<div className="max-w-2xl space-y-2">
				<h3>Sign in to use Link Checker</h3>
				<p className="text-sm text-zinc-800">
				Launch new crawls, track your previous jobs, and inspect results as they update.
				</p>
			</div>
			<Suspense fallback={<div/>}><SignInWithGoogle/></Suspense>
		</div>
		)}
	</div>
	);
}