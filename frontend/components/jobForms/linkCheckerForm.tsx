"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/src/api";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/field";
import { CircleX } from "lucide-react";

type Props = {
  onCreated?: () => void | Promise<void>;
  onCancel?: () => void;
};

export default function NewLinkCheckerJobForm({
		onCreated,
		onCancel,
	}: Props) {
	const [baseUrl, setBaseUrl] = useState("");
	const [createError, setCreateError] = useState<string | null>(null);
	const [isCreating, setIsCreating] = useState(false);

	async function handleSubmit(e: React.SubmitEvent) {
		e.preventDefault();
		setCreateError(null);
		setIsCreating(true);

		try {
			const res = await apiPost("/link-checker", {baseUrl: baseUrl});
			const body = await res.json();

			if (res.status === 422) {
				setCreateError(body.error || "Invalid URL.");
				return;
			}

			if (!res.ok) {
				setCreateError("Failed to create job.");
				return;
			}

			setBaseUrl("");
			await onCreated?.();
			onCancel?.();
		} catch (err) {
			console.error("Error creating job:", err);
			setCreateError("Something went wrong creating the job. Please try again soon.");
		} finally {
			setIsCreating(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex items-center justify-center">
			<div className="flex flex-wrap justify-center gap-4 items-center">
				<h3 className="stat-box">Create a new job</h3>
				<div className="flex items-baseline justify-center gap-2">
					<FieldLabel htmlFor="baseUrl">URL:</FieldLabel>
					<div className="relative">
						{createError ? (
						<p className="absolute -top-2 -translate-y-full rounded bg-white px-1 text-xs font-medium text-red-600 w-max">
						{createError}
						</p>
						) : null}

						<Input 
						id="baseUrl"
						type="url"
						value={baseUrl} 
						onChange={(e) => {setBaseUrl(e.target.value); if (createError) setCreateError(null);}}
						placeholder="https://example.com"
						disabled={isCreating}
						required
						aria-invalid={!!createError}
						className={createError ? "border-red-500 focus-visible:ring-red-500" : ""}
						></Input>
					</div>					
				</div>

				

				<div>

				</div>
				<Button type="submit" disabled={isCreating || !baseUrl.trim()}>Start crawl</Button>

				{onCancel ? (
				<Button
					type="button"
					variant="secondary"
					size="icon"
					onClick={onCancel}
					aria-label="Close new job form"
					disabled={isCreating}
					className="rounded-full"
				>
					<CircleX/>
				</Button>
				) : null}
			</div>
		</form>
	);
}