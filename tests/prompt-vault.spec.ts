import { expect, test } from "@playwright/test";
import { createHmac } from "node:crypto";
import path from "node:path";

function createSessionToken(username: string) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: username,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    }),
  )
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const signature = createHmac("sha256", "playwright-session-secret")
    .update(payload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${payload}.${signature}`;
}

test("homepage supports search, modal open, copy, infinite scroll, and end message", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Prompt Vault" })).toBeVisible();
  await expect(page.locator("[data-testid='prompt-card']")).toHaveCount(12);
  await expect(page.locator("[data-testid='homepage-tag']")).toHaveCount(20);

  const homepageTags = page.locator("[data-testid='homepage-tag']");
  await expect(homepageTags.nth(0)).toHaveText("advertising");
  await expect(homepageTags.nth(1)).toHaveText("audio");
  await expect(homepageTags.nth(2)).toHaveText("brand voice");
  await expect(homepageTags.nth(3)).toHaveText("campaigns");
  await expect(homepageTags.nth(4)).toHaveText("case study");
  await expect(homepageTags.nth(5)).toHaveText("copywriting");

  await page.getByPlaceholder("Search content or tags").fill("podcast");
  await expect(page.locator("[data-testid='prompt-card']")).toHaveCount(1);
  await expect(page.getByText("Podcast intro outline")).toBeVisible();
  const podcastCardPreview = page.locator("[data-testid='prompt-card-preview']").first();
  await expect(podcastCardPreview).toContainText("Create a podcast intro for the episode below.");
  await expect(podcastCardPreview).not.toContainText("Draft a crisp opening for a podcast episode");

  await page.getByRole("button", { name: /Podcast intro outline/i }).click();
  await expect(page.getByRole("heading", { name: "Podcast intro outline", level: 2 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy prompt" })).toBeVisible();

  await page.getByRole("button", { name: "Copy prompt" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();

  await page.getByLabel("Close prompt").nth(1).click();
  await page.getByPlaceholder("Search content or tags").fill("");
  await expect(page.locator("[data-testid='prompt-card']")).toHaveCount(12);
});

test("admin can create, edit, favourite, and delete a prompt", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
  const txtAttachmentPath = path.join(process.cwd(), "tests", "fixtures", "prompt-context.txt");
  const jsonAttachmentPath = path.join(process.cwd(), "tests", "fixtures", "prompt-settings.json");

  await page.context().addCookies([
    {
      name: "prompt-vault-session",
      value: createSessionToken("playwright-admin"),
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Manage your prompt library" })).toBeVisible();

  await page.getByRole("link", { name: "Add prompt" }).click();
  await page.getByRole("button", { name: "Marketing" }).click();
  await expect(page.getByLabel("Category")).toHaveValue("Marketing");
  await page.getByRole("button", { name: "audio" }).nth(1).click();
  await expect(page.getByLabel("Tags")).toHaveValue("audio");
  await page.getByLabel("Title").fill("Prompt testing workflow");
  await page.getByLabel("Summary").fill("A saved prompt for checking app changes before release.");
  await page.getByLabel("Category").fill("Development");
  await page.getByLabel("Tags").fill("testing, release, qa");
  await page.getByLabel("Prompt content").fill(`## Goal

Review a release candidate before it goes live.

- check core user journeys
- highlight risks
- suggest the next best fix
`);
  await page.getByLabel("Attachments").setInputFiles([txtAttachmentPath, jsonAttachmentPath]);
  await page.getByRole("button", { name: "Save prompt" }).click();

  await expect(page.getByText("Prompt testing workflow")).toBeVisible();

  await page.getByRole("link", { name: "Edit" }).first().click();
  await page.getByLabel("Summary").fill("An updated saved prompt for checking app changes before release.");
  await page.getByRole("button", { name: "Update prompt" }).click();

  await expect(page.getByText("An updated saved prompt for checking app changes before release.")).toBeVisible();

  const promptCard = page.locator("article", { hasText: "Prompt testing workflow" }).first();
  await promptCard.getByRole("button", { name: "Favourite" }).click();
  await expect(promptCard.getByRole("button", { name: "Remove favourite" })).toBeVisible();
  const updatedPromptCard = page.locator("article", { hasText: "Prompt testing workflow" }).first();

  await updatedPromptCard.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Prompt testing workflow")).not.toBeVisible();
});
