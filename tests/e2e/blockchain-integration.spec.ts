import { test, expect } from '@playwright/test';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';

test.describe('Blockchain Integration', () => {
  let connection: Connection;
  
  test.beforeAll(() => {
    connection = new Connection('http://localhost:8899', 'confirmed');
  });

  test('should display token balance when wallet connected', async ({ page }) => {
    await page.goto('/');
    
    // Mock wallet connection
    await page.evaluate(() => {
      window.localStorage.setItem('walletConnected', 'true');
      window.localStorage.setItem('walletAddress', '11111111111111111111111111111111');
    });
    
    await page.reload();
    
    // Check token balance display
    await expect(page.locator('text=$ZAP:')).toBeVisible();
    await expect(page.locator('text=SOL:')).toBeVisible();
  });

  test('should handle token earning events', async ({ page }) => {
    await page.goto('/');
    
    // Start game with mocked wallet
    await page.evaluate(() => {
      window.localStorage.setItem('walletConnected', 'true');
    });
    await page.reload();
    await page.locator('button:has-text("SOLO SURVIVAL")').click();
    
    // Wait for game to load
    await page.waitForTimeout(3000);
    
    // Trigger a zombie kill event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('zombieKilled', {
        detail: { points: 100, tokensEarned: 5 }
      }));
    });
    
    // Check for token earned notification
    await expect(page.locator('text=+5 $ZAP')).toBeVisible();
  });

  test('should show perk shop with token prices', async ({ page }) => {
    await page.goto('/');
    
    // Start game
    await page.evaluate(() => {
      window.localStorage.setItem('walletConnected', 'true');
    });
    await page.reload();
    await page.locator('button:has-text("SOLO SURVIVAL")').click();
    
    // Open perk shop
    await page.keyboard.press('b');
    
    // Check perk prices are shown in $ZAP
    await expect(page.locator('text=Juggernog')).toBeVisible();
    await expect(page.locator('text=$ZAP')).toBeVisible();
  });

  test('should show mystery box with NFT information', async ({ page }) => {
    await page.goto('/');
    
    // Start game
    await page.evaluate(() => {
      window.localStorage.setItem('walletConnected', 'true');
    });
    await page.reload();
    await page.locator('button:has-text("SOLO SURVIVAL")').click();
    
    // Open mystery box
    await page.keyboard.press('m');
    
    // Check mystery box UI
    await expect(page.locator('text=Mystery Box')).toBeVisible();
    await expect(page.locator('text=950 $ZAP')).toBeVisible();
  });
});