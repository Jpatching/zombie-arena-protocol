import { test, expect } from '@playwright/test';

test.describe('Wallet Connection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display wallet connection button', async ({ page }) => {
    const walletButton = page.locator('button:has-text("Select Wallet")');
    await expect(walletButton).toBeVisible();
  });

  test('should show main menu after page load', async ({ page }) => {
    await expect(page.locator('h1:has-text("ZOMBIE ARENA PROTOCOL")')).toBeVisible();
    await expect(page.locator('text=Survive. Earn. Dominate.')).toBeVisible();
  });

  test('should disable game buttons when wallet not connected', async ({ page }) => {
    const soloButton = page.locator('button:has-text("SOLO SURVIVAL")');
    const multiplayerButton = page.locator('button:has-text("MULTIPLAYER MAYHEM")');
    
    await expect(soloButton).toBeDisabled();
    await expect(multiplayerButton).toBeDisabled();
  });

  test('should show wallet connection prompt', async ({ page }) => {
    await expect(page.locator('text=Connect your wallet to start playing')).toBeVisible();
  });
});