import { test, expect } from '@playwright/test';

test('homepage shows Getting started and login flow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Getting started/i })).toBeVisible();
  await page.getByRole('link', { name: /Getting started/i }).click();
  await expect(page).toHaveURL(/.*\/login/);
  await page.getByPlaceholder('Email').fill('admin@example.com');
  await page.getByPlaceholder('Password').fill('secret');
  await page.getByRole('button', { name: /submit/i }).click();
  await expect(page).toHaveURL(/.*\/dashboard/);
  await expect(page.getByText('Workspaces')).toBeVisible();
  await expect(page.getByText('Users')).toBeVisible();
});
