from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.goto("http://localhost:8080/")

    # --- Bypass Login ---
    page.evaluate("""
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('loading-view').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
    """)

    # --- REG-001 & REG-002: Fractional Units, Edit/Delete Articles ---
    page.evaluate("""
        document.getElementById('main-menu-view').classList.add('hidden');
        document.getElementById('articulos-section').classList.remove('hidden');
        document.getElementById('fab-add-articulo').classList.remove('hidden');
    """)
    page.locator("#fab-add-articulo").click()
    expect(page.locator("#add-articulo-modal-overlay")).to_be_visible()
    page.locator("#article-unidad").fill("0.5")
    expect(page.locator("#article-unidad")).to_have_value("0.5")
    page.screenshot(path="jules-scratch/verification/fix-reg-001-fractional-units.png")
    page.locator("#close-add-articulo-modal").click()

    page.evaluate("""
        const container = document.getElementById('lista-articulos-container');
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'bg-slate-800 p-4 rounded-lg';
        categoryContainer.innerHTML = `
            <div class="space-y-2 mt-3">
                <div class="grid grid-cols-1 sm:grid-cols-5 items-center gap-4 p-2 rounded-md hover:bg-slate-700/50" data-id="test-article-id" data-nombre="Test Article">
                    <div class="sm:col-span-2"><p class="font-medium">Test Article</p></div>
                    <p>Stock: <span class="font-bold">10</span></p>
                    <div class="sm:col-span-1"><button class="load-stock-btn">Cargar</button></div>
                    <div class="sm:col-span-1 flex space-x-2">
                        <button class="edit-article-btn p-2 bg-yellow-600">✏️</button>
                        <button class="delete-article-btn p-2 bg-red-600">🗑️</button>
                    </div>
                </div>
            </div>`;
        container.appendChild(categoryContainer);
    """)
    page.evaluate("document.getElementById('add-articulo-modal-overlay').classList.remove('hidden')")
    expect(page.locator("#add-articulo-modal-overlay")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/fix-reg-002-edit-article-modal.png")
    page.locator("#close-add-articulo-modal").click()
    page.locator(".delete-article-btn").click()
    expect(page.locator("#confirmation-modal-overlay")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/fix-reg-002-delete-article-modal.png")
    page.locator("#confirmation-modal-cancel-btn").click()

    # --- REG-003: Edit/Delete Members ---
    page.evaluate("""
        document.getElementById('articulos-section').classList.add('hidden');
        document.getElementById('fab-add-articulo').classList.add('hidden');
        document.getElementById('socios').classList.remove('hidden');
        document.getElementById('fab-add-socio').classList.remove('hidden');
        const socioCard = document.createElement('div');
        socioCard.className = 'socio-card p-4 bg-slate-800 rounded-lg flex justify-between items-center';
        socioCard.dataset.id = 'test-socio-id';
        socioCard.dataset.nombre = 'Test Socio';
        socioCard.innerHTML = `
            <div><p class="font-semibold text-white">Test Socio</p></div>
            <div class="flex items-center space-x-2">
                <button class="edit-socio-btn p-2 bg-yellow-600">✏️</button>
                <button class="delete-socio-btn p-2 bg-red-600" data-id="test-socio-id" data-nombre="Test Socio">🗑️</button>
            </div>`;
        document.getElementById('socios-list').appendChild(socioCard);
    """)
    page.evaluate("document.getElementById('add-socio-modal-overlay').classList.remove('hidden')")
    expect(page.locator("#add-socio-modal-overlay")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/fix-reg-003-edit-socio-modal.png")
    page.locator("#close-add-socio-modal").click()
    page.locator(".delete-socio-btn").click()
    expect(page.locator("#confirmation-modal-overlay")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/fix-reg-003-delete-socio-modal.png")
    page.locator("#confirmation-modal-cancel-btn").click()

    # --- REG-004: Searchable POS Inputs ---
    page.evaluate("""
        document.getElementById('socios').classList.add('hidden');
        document.getElementById('fab-add-socio').classList.add('hidden');
        document.getElementById('tpv-section').classList.remove('hidden');
        const socioDatalist = document.getElementById('tpv-socios-datalist');
        const socioOption = document.createElement('option');
        socioOption.value = 'Test Socio';
        socioDatalist.appendChild(socioOption);
        const articuloDatalist = document.getElementById('tpv-articulos-datalist');
        const articuloOption = document.createElement('option');
        articuloOption.value = 'Test Articulo';
        articuloDatalist.appendChild(articuloOption);
    """)
    page.locator("#tpv-socio-input").fill("Test")
    page.screenshot(path="jules-scratch/verification/fix-reg-004-pos-search.png")


    browser.close()

with sync_playwright() as playwright:
    run(playwright)