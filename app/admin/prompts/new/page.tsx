import { createPromptAction } from "@/app/admin/actions";
import { AdminPromptForm } from "@/components/admin-prompt-form";
import { getPromptEditorSuggestions } from "@/lib/prompts";

export default async function NewPromptPage() {
  const suggestions = await getPromptEditorSuggestions();

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-muted">Create prompt</p>
        <h2 className="mt-3 text-3xl font-semibold">Add a new prompt to Prompt Vault</h2>
      </div>

      <AdminPromptForm action={createPromptAction} submitLabel="Save prompt" suggestions={suggestions} />
    </section>
  );
}
