import { test, expect } from '@playwright/test';

test.describe('Game Mechanics', () => {
  test.use({
    // Mock wallet connection
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://localhost:3000',
        localStorage: [{
          name: 'walletConnected',
          value: 'true'
        }]
      }]
    }
  });

  test('should start solo game', async ({ page }) => {
    await page.goto('/');
    
    // Start solo game
    const soloButton = page.locator('button:has-text("SOLO SURVIVAL")');
    await soloButton.click();
    
    // Check if game canvas is visible
    await expect(page.locator('#game-canvas')).toBeVisible();
  });

  test('should display HUD elements', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("SOLO SURVIVAL")').click();
    
    // Wait for game to load
    await page.waitForTimeout(2000);
    
    // Check HUD elements
    await expect(page.locator('text=HEALTH')).toBeVisible();
    await expect(page.locator('text=ROUND')).toBeVisible();
    await expect(page.locator('text=POINTS')).toBeVisible();
    await expect(page.locator('text=AMMO')).toBeVisible();
  });

  test('should open pause menu with ESC key', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("SOLO SURVIVAL")').click();
    
    // Press ESC
    await page.keyboard.press('Escape');
    
    // Check pause menu
    await expect(page.locator('h2:has-text("PAUSED")')).toBeVisible();
    await expect(page.locator('button:has-text("Resume")')).toBeVisible();
    await expect(page.locator('button:has-text("Main Menu")')).toBeVisible();
  });

  test('should return to main menu from pause', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("SOLO SURVIVAL")').click();
    
    // Open pause menu and return to main menu
    await page.keyboard.press('Escape');
    await page.locator('button:has-text("Main Menu")').click();
    
    // Should be back at main menu
    await expect(page.locator('h1:has-text("ZOMBIE ARENA PROTOCOL")')).toBeVisible();
  });
});