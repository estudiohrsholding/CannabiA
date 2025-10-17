from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the local server
        page.goto("http://localhost:8080")

        # Wait for the login form to be visible, which indicates the app has loaded past the initial error
        login_form = page.locator("#login-form")
        expect(login_form).to_be_visible(timeout=10000) # Increased timeout for initial load

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

if __name__ == "__main__":
    run_verification()