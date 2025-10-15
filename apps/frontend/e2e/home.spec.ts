import { test, expect } from '@playwright/test';

// Basic smoke test for the Next.js app
// Adjust selectors/text to fit your actual homepage content

test('homepage loads and shows title', async ({ page }) => {
  await page.goto('/');
  // Expect some common content on the dashboard/home page
  // Try a few possible texts to be lenient
  const candidates = [
    /dashboard/i,
    /mini[- ]?pms/i,
    /projects/i,
    /workspaces/i,
  ];

  // Check at least one appears
  const matches = await Promise.all(
    candidates.map(async (re) => await page.getByText(re).first().isVisible().catch(() => false))
  );
  expect(matches.some(Boolean)).toBeTruthy();
});
