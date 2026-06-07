import time
from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Record video
        context = browser.new_context(record_video_dir="verification/videos/")
        page = context.new_page()

        print("Navigating to localhost:5173...")
        page.goto("http://localhost:5173/")
        time.sleep(2)

        print("Skipping setup...")
        try:
            page.locator("button:has-text('Skip setup')").click(timeout=3000)
            time.sleep(2)
        except:
            pass

        print("Going to Goals...")
        page.locator("button:has-text('Goals')").first.click(timeout=3000)
        time.sleep(1)

        print("Opening New Goal Wizard...")
        page.locator("button:has-text('New goal')").click(timeout=3000)
        time.sleep(1)

        print("Step 1: Goal basics...")
        page.locator("input[placeholder='e.g. Run a 5K under 25 minutes']").fill("Automated Goal Test")
        page.locator("button:has-text('Continue')").click()
        time.sleep(1)

        print("Step 2: Sub-goals/Milestones...")
        page.locator("button:has-text('Continue')").click()
        time.sleep(1)

        print("Step 3: Starter tasks...")
        page.locator("button:has-text('Continue')").click()
        time.sleep(1)

        print("Step 4: Sub-tasks...")
        # Since 'Finish' creates the goal and might leave a success toast overlay or something, we'll wait a bit longer
        page.locator("button:has-text('Finish')").click()
        time.sleep(3)

        # It looks like the overlay (bg-black/80) might not be fully closed when we try to click.
        # Pressing Escape usually closes lingering overlays
        page.keyboard.press("Escape")
        time.sleep(1)

        print("Opening Goal Edit Modal (clicking on the created goal card)...")
        # Click on the goal card text. Force click if the overlay is still somehow intercepting it.
        page.locator("text='Automated Goal Test'").first.click(force=True)
        time.sleep(2)

        print("Taking screenshot of the opened Edit Goal modal...")
        page.screenshot(path="verification/screenshots/edit_goal_modal.png")

        context.close()
        browser.close()

if __name__ == "__main__":
    main()
