import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Navigate to the dashboard with the onboarding bypass query parameter
        await page.goto('http://localhost:8081/?onboarding=1')

        # Click the "Skip setup" button to close the onboarding
        try:
            await page.click('button:has-text("Skip setup")', timeout=5000)
            # Wait a bit for the modal to close
            await page.wait_for_timeout(1000)
        except Exception as e:
            print("Could not find or click 'Skip setup':", e)

        # Take screenshot of the empty dashboard
        await page.screenshot(path='verification/screenshots/verification.png', full_page=True)

        await browser.close()

asyncio.run(main())
