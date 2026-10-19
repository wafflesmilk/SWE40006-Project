import { test, expect } from "@playwright/test";

test("search filters notes by title and content and can be cleared", async ({ page }) => {
  const suffix = `${Date.now()}-${Math.random()}`;
  const title = `Search demo ${suffix}`;
  const otherTitle = `Other note ${suffix}`;
  const content = `Unique content ${suffix}`;
  const noteUrls: string[] = [];

  try {
    for (const [noteTitle, noteContent] of [
      [title, content],
      [otherTitle, "Unrelated content"],
    ]) {
      await page.goto("/notes/new");
      await page.getByLabel("Title").fill(noteTitle);
      await page.getByLabel("Content").fill(noteContent);
      await page.getByRole("button", { name: "Save note" }).click();
      await expect(page).toHaveURL(/\/notes\/\d+$/);
      noteUrls.push(page.url());
    }

    await page.goto("/");
    const search = page.getByRole("searchbox", { name: "Search notes" });
    await search.fill(`  ${title.toUpperCase()}  `);
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: otherTitle, exact: true })).toHaveCount(0);

    await search.fill(content.toUpperCase());
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: otherTitle, exact: true })).toHaveCount(0);

    await search.fill(`No match ${suffix}`);
    await expect(page.getByText("No notes match your search.")).toBeVisible();
    await expect(page.getByRole("list")).toHaveCount(0);

    await search.fill("");
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: otherTitle, exact: true })).toBeVisible();
  } finally {
    for (const url of noteUrls) {
      await page.goto(url);
      await page.getByRole("button", { name: "Delete note" }).click();
      await expect(page).toHaveURL("/");
    }
  }
});

test("load home page @smoke", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Notes");
  await expect(
    page.getByRole("heading", { name: "My Notes", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "New note" })).toBeVisible();
  await expect(page.getByText(/^\d+ notes?$/)).toBeVisible();
});

test("new note button redirects to new page @smoke", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "New note" }).click();
  await expect(page).toHaveURL(/\/notes\/new$/);
  await expect(page).toHaveTitle("New note");
  await expect(
    page.getByRole("heading", { name: "New note", level: 1 }),
  ).toBeVisible();
});

test("shows an error when the title is blank", async ({ page }) => {
  await page.goto("/notes/new");

  await page.getByLabel("Content").fill("sample content");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText("Title and content are required.")).toBeVisible();
});

test("shows an error when the content is blank", async ({ page }) => {
  await page.goto("/notes/new");

  await page.getByLabel("Title").fill("sample title");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText("Title and content are required.")).toBeVisible();
});

test("cancel button redirects to home page", async ({ page }) => {
  await page.goto("/notes/new");
  await page.getByRole("link", { name: "Cancel" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: "New note" })).toBeVisible();
});

test("create a new note and see it on home page", async ({ page }) => {
  const title = `Note ${Math.random()}`;

  await page.goto("/notes/new");
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Content").fill("sample content");
  await page.getByRole("button", { name: "Save note" }).click();

  await expect(page).toHaveURL(/\/notes\/\d+$/); // redirected to the note's detail page

  await page.goto("/"); // goto home page and check that the note is there
  await expect(
    page.getByRole("heading", { level: 2, name: title }),
  ).toBeVisible();
  // cleanup
  await page.getByRole("link", { name: title }).click();
  await page.getByRole("button", { name: "Delete note" }).click();
  await expect(page).toHaveURL("/");
});

test("Back to notes link redirects to home page", async ({ page }) => {
  const title = `Note ${Math.random()}`;
  await page.goto("/notes/new");
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Content").fill("sample content");
  await page.getByRole("button", { name: "Save note" }).click();

  await expect(page).toHaveURL(/\/notes\/\d+$/);
  await page.getByRole("link", { name: "Back to notes" }).click();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { level: 2, name: title }),
  ).toBeVisible();
  //cleanup
  await page.getByRole("link", { name: title }).click();
  await page.getByRole("button", { name: "Delete note" }).click();
  await expect(page).toHaveURL("/");
});

test("create, view, and delete a note", async ({ page }) => {
  const title = `Note ${Math.random()}`;
  //create
  await page.goto("/notes/new");
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Content").fill("sample content");
  await page.getByRole("button", { name: "Save note" }).click();
  //view
  await expect(page).toHaveURL(/\/notes\/\d+$/);
  await expect(page).toHaveTitle("Note");
  await expect(
    page.getByRole("heading", { name: title, level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("sample content")).toBeVisible();
  await expect(page.getByText(/^Created /)).toBeVisible();
  //delete
  await page.getByRole("button", { name: "Delete note" }).click();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { level: 2, name: title }),
  ).toHaveCount(0);
});
