from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        print("Navigating to http://localhost:3000/notes...")
        page.goto('http://localhost:3000/notes')
        page.wait_for_load_state('networkidle')
        
        # Take a screenshot to see where we are
        page.screenshot(path='test_notes_1.png', full_page=True)
        print("Page URL:", page.url)
        print("Page Title:", page.title())
        
        # Get body text to check if we are on login page or notes page
        body_text = page.locator('body').inner_text()
        print("Body Text excerpt:", body_text[:200])

        browser.close()

if __name__ == '__main__':
    run()
