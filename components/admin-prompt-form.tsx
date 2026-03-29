"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { formatFileSize, getAllowedAttachmentExtensions } from "@/lib/attachment-config";
import type { PromptDetailRecord, PromptFormState } from "@/lib/types";

const initialState: PromptFormState = {
  success: false,
  message: "",
};

type AdminPromptFormProps = {
  action: (state: PromptFormState, formData: FormData) => Promise<PromptFormState>;
  prompt?: PromptDetailRecord;
  submitLabel: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

export function AdminPromptForm({ action, prompt, submitLabel }: AdminPromptFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, initialState);
  const acceptedAttachmentTypes = getAllowedAttachmentExtensions().map((extension) => `.${extension}`).join(",");

  useEffect(() => {
    if (state.success && state.redirectTo) {
      router.replace(state.redirectTo);
      router.refresh();
    }
  }, [router, state.redirectTo, state.success]);

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="space-y-6 rounded-[2rem] border border-line/70 bg-panel/80 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.08)]"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="title" className="text-sm font-medium text-foreground/78">
            Title
          </label>
          <input
            id="title"
            name="title"
            defaultValue={prompt?.title ?? ""}
            className="w-full rounded-2xl border border-line/70 bg-background/70 px-4 py-3 outline-none transition focus:border-accent/70"
            placeholder="For example, Resume polish for technical roles"
          />
          {state.errors?.title ? <p className="status-error-text text-sm">{state.errors.title}</p> : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="summary" className="text-sm font-medium text-foreground/78">
            Summary
          </label>
          <textarea
            id="summary"
            name="summary"
            defaultValue={prompt?.summary ?? ""}
            rows={3}
            className="w-full rounded-2xl border border-line/70 bg-background/70 px-4 py-3 outline-none transition focus:border-accent/70"
            placeholder="A short summary shown on the prompt card"
          />
          {state.errors?.summary ? <p className="status-error-text text-sm">{state.errors.summary}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium text-foreground/78">
            Type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={prompt ? prompt.type.toUpperCase() : "TEXT"}
            className="w-full rounded-2xl border border-line/70 bg-background/70 px-4 py-3 outline-none transition focus:border-accent/70"
          >
            <option value="TEXT">Text</option>
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
            <option value="AUDIO">Audio</option>
          </select>
          {state.errors?.type ? <p className="status-error-text text-sm">{state.errors.type}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium text-foreground/78">
            Category
          </label>
          <input
            id="category"
            name="category"
            defaultValue={prompt?.category ?? ""}
            className="w-full rounded-2xl border border-line/70 bg-background/70 px-4 py-3 outline-none transition focus:border-accent/70"
            placeholder="Marketing"
          />
          {state.errors?.category ? <p className="status-error-text text-sm">{state.errors.category}</p> : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="tags" className="text-sm font-medium text-foreground/78">
            Tags
          </label>
          <input
            id="tags"
            name="tags"
            defaultValue={prompt?.tags.join(", ") ?? ""}
            className="w-full rounded-2xl border border-line/70 bg-background/70 px-4 py-3 outline-none transition focus:border-accent/70"
            placeholder="prompt-design, marketing, editing"
          />
          <p className="text-sm text-muted">Separate tags with commas.</p>
          {state.errors?.tags ? <p className="status-error-text text-sm">{state.errors.tags}</p> : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="contentMarkdown" className="text-sm font-medium text-foreground/78">
            Prompt content
          </label>
          <textarea
            id="contentMarkdown"
            name="contentMarkdown"
            defaultValue={prompt?.contentMarkdown ?? ""}
            rows={16}
            className="min-h-[24rem] w-full rounded-2xl border border-line/70 bg-background/70 px-4 py-3 font-mono text-sm outline-none transition focus:border-accent/70"
            placeholder="Write your full prompt here using Markdown."
          />
          {state.errors?.contentMarkdown ? (
            <p className="status-error-text text-sm">{state.errors.contentMarkdown}</p>
          ) : null}
        </div>

        <div className="space-y-3 md:col-span-2">
          <label htmlFor="attachments" className="text-sm font-medium text-foreground/78">
            Attachments
          </label>
          <input
            id="attachments"
            name="attachments"
            type="file"
            multiple
            accept={acceptedAttachmentTypes}
            className="w-full rounded-2xl border border-line/70 bg-background/70 px-4 py-3 text-sm outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:font-medium file:text-white hover:file:opacity-90 focus:border-accent/70"
          />
          <p className="text-sm leading-6 text-muted">
            Add safe reference files up to 5 MB each. Allowed types: {getAllowedAttachmentExtensions().join(", ")}.
          </p>
          {prompt?.attachments.length ? (
            <div className="space-y-3 rounded-[1.5rem] border border-line/70 bg-background/50 p-4">
              <p className="text-sm font-medium text-foreground/78">Existing attachments</p>
              <div className="space-y-3">
                {prompt.attachments.map((attachment) => (
                  <label
                    key={attachment.id}
                    className="flex flex-col gap-2 rounded-2xl border border-line/60 bg-panel/60 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
                  >
                    <span>
                      <span className="font-medium text-foreground">{attachment.originalName}</span>
                      <span className="ml-2 text-muted">({formatFileSize(attachment.sizeBytes)})</span>
                    </span>
                    <span className="inline-flex items-center gap-2 text-foreground/72">
                      <input
                        type="checkbox"
                        name="removeAttachmentIds"
                        value={attachment.id}
                        className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
                      />
                      Remove this file
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          {state.errors?.attachments ? <p className="status-error-text text-sm">{state.errors.attachments}</p> : null}
        </div>
      </div>

      {state.message ? (
        <p
          className={
            state.success
              ? "status-success rounded-2xl px-4 py-3 text-sm"
              : "status-error rounded-2xl px-4 py-3 text-sm"
          }
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex items-center justify-end">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
