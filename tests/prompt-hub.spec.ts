import { expect, test } from "@playwright/test";

test("homepage supports search, modal open, copy, infinite scroll, and end message", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Prompt Hub" })).toBeVisible();
  await expect(page.locator("[data-testid='prompt-card']")).toHaveCount(12);
  await expect(page.locator("[data-testid='homepage-tag']")).toHaveCount(20);

  const homepageTags = page.locator("[data-testid='homepage-tag']");
  await expect(homepageTags.nth(0)).toHaveText("audio");
  await expect(homepageTags.nth(1)).toHaveText("editing");
  await expect(homepageTags.nth(2)).toHaveText("image generation");
  await expect(homepageTags.nth(3)).toHaveText("script");
  await expect(homepageTags.nth(4)).toHaveText("video");
  await expect(homepageTags.nth(5)).toHaveText("writing");

  await page.getByPlaceholder("Search content or tags").fill("podcast");
  await expect(page.locator("[data-testid='prompt-card']")).toHaveCount(1);
  await expect(page.getByText("Podcast intro outline")).toBeVisible();

  await page.getByRole("button", { name: /Podcast intro outline/i }).click();
  await expect(page.locator("[data-testid='prompt-modal']")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy prompt" })).toBeVisible();

  await page.getByRole("button", { name: "Copy prompt" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();

  await page.getByLabel("Close prompt").click();
  await page.getByPlaceholder("Search content or tags").fill("");
  await expect(page.locator("[data-testid='prompt-card']")).toHaveCount(12);

  await page.getByRole("combobox").nth(1).selectOption("Prompt Engineering");
  await expect(page.locator("[data-testid='prompt-card']")).toHaveCount(1);
  await expect(page.getByText("Prompt critique and improvement pass")).toBeVisible();
  await page.getByRole("combobox").nth(1).selectOption("");
  await expect(page.locator("[data-testid='prompt-card']")).toHaveCount(12);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator("[data-testid='prompt-card']")).toHaveCount(15);
  await expect(page.locator("[data-testid='end-of-page']")).toHaveText("You have reached the end of the page");
});

test("admin can create, edit, favourite, and delete a prompt", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto("/login");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("prompt-hub-test");
  await page.getByRole("button", { name: "Sign in to Prompt Hub" }).click();

  await expect(page.getByRole("heading", { name: "Manage your prompt library" })).toBeVisible();

  await page.getByRole("link", { name: "Add prompt" }).click();
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
  await page.getByRole("button", { name: "Save prompt" }).click();

  await expect(page.getByText("Prompt testing workflow")).toBeVisible();

  await page.getByRole("link", { name: "Edit" }).first().click();
  await page.getByLabel("Summary").fill("An updated saved prompt for checking app changes before release.");
  await page.getByRole("button", { name: "Update prompt" }).click();

  await expect(page.getByText("An updated saved prompt for checking app changes before release.")).toBeVisible();

  const promptCard = page.locator("article", { hasText: "Prompt testing workflow" }).first();
  await promptCard.getByRole("button", { name: "Favourite" }).click();
  await expect(promptCard.getByRole("button", { name: "Remove favourite" })).toBeVisible();

  await promptCard.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Prompt testing workflow")).not.toBeVisible();
});
