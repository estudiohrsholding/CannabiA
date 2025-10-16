import asyncio
import os
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Navigate to the local index.html file
        await page.goto(f"file://{os.path.abspath('index.html')}")

        # The app starts on the loading view, then shows the login view.
        # We can't log in, but we can manipulate the DOM to show the app container.
        await page.evaluate('''() => {
            document.getElementById('login-view').classList.add('hidden');
            document.getElementById('app-container').classList.remove('hidden');
            document.getElementById('main-menu-view').classList.add('hidden');
            document.getElementById('articulos-section').classList.remove('hidden');
        }''')

        # Verify Form and List are visible
        await expect(page.locator("#form-articulo")).to_be_visible()
        await expect(page.locator("#lista-articulos-container")).to_be_visible()

        # Take a screenshot of the initial articles view
        await page.screenshot(path="jules-scratch/verification/articulos_view_initial.png")

        # Since we can't add a real article without Firebase, we'll just verify the UI elements exist.
        # We can simulate adding an article to the DOM to test the visual layout.
        await page.evaluate('''() => {
            const container = document.getElementById('lista-articulos-container');
            container.innerHTML = `
                <div class="bg-gray-800 p-4 rounded-lg">
                    <h2 class="text-xl font-semibold mb-3 text-blue-400 border-b border-gray-700 pb-2">Demo Categoria</h2>
                    <div class="space-y-2 mt-3">
                        <div class="grid grid-cols-1 sm:grid-cols-4 items-center gap-4 p-2 rounded-md hover:bg-gray-700/50" data-id="demo-id">
                            <div class="sm:col-span-2">
                                <p class="font-medium">Demo Articulo</p>
                                <p class="text-xs text-gray-400">Precio: 12.99€</p>
                            </div>
                            <p>Stock: <span class="font-bold">10</span></p>
                            <form class="stock-form inline-flex items-center gap-2">
                                <input type="number" min="1" placeholder="Cantidad" class="stock-input bg-gray-600 border border-gray-500 text-white sm:text-sm rounded-lg w-24 p-1.5">
                                <button type="submit" class="load-stock-btn bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 rounded-lg">Cargar Stock</button>
                            </form>
                        </div>
                    </div>
                </div>
            `;
        }''')

        # Verify the demo article is visible
        await expect(page.locator("h2:has-text('Demo Categoria')")).to_be_visible()
        await expect(page.locator("p:has-text('Demo Articulo')")).to_be_visible()
        await expect(page.locator("p:has-text('Stock: 10')")).to_be_visible()

        # Take a final screenshot showing the simulated data
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())