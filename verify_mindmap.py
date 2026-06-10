from playwright.sync_api import sync_playwright
import os
import glob

def run():
    print("Starting Playwright verification for Map View Expand...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Record video to capture the interactions
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            record_video_dir="/home/jules/verification/videos",
            record_video_size={"width": 1280, "height": 800}
        )
        page = context.new_page()

        print("Navigating to setup local storage...")
        page.goto("http://localhost:8080/home")
        page.wait_for_timeout(1000)

        print("Injecting test data...")
        page.evaluate("""
            const data = {
                settings: { onboardedAt: new Date().toISOString(), theme: "light" },
                skills: [{ id: 's1', label: 'Software Engineering', color: '#3b82f6' }],
                goals: [{
                    id: 'g1',
                    skill: 's1',
                    title: 'Learn Playwright',
                    targetDate: '2024-12-31',
                    startDate: '2024-01-01',
                    status: 'in_progress',
                    subGoals: [{ id: 'm1', title: 'Write tests', done: false }]
                }],
                tasks: [
                    { id: 't1', subGoalId: 'm1', title: 'Test mind map', priority: 'high', done: false, subtasks: [{ id: 'st1', title: 'Verify UI', done: false }] },
                    { id: 't2', title: 'General daily task', priority: 'medium', done: false, subtasks: [] }
                ],
                bucketList: []
            };
            localStorage.setItem('life-manager:v1', JSON.stringify(data));
        """)

        print("Navigating to index...")
        page.goto("http://localhost:8080/")
        page.wait_for_timeout(1000)

        try:
            print("Clicking Overview...")
            page.locator("button:has-text('Overview')").first.click()
            page.wait_for_timeout(1000)

            print("Switching to Map view...")
            page.locator("button:has-text('Map')").click()
            page.wait_for_timeout(2000) # Wait for react flow to render and layout

            print("Clicking Expand...")
            page.locator("button:has-text('Expand')").click()
            page.wait_for_timeout(2000)

            os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
            screenshot_path = "/home/jules/verification/screenshots/verification_mindmap_1.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"Error during interaction: {e}")

        # Close context to ensure video is saved
        context.close()
        browser.close()

if __name__ == "__main__":
    run()
