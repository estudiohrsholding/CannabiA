// RUTA DEL ARCHIVO: src/app.js

// Importa las funciones que necesitas de los SDKs de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, serverTimestamp, query, orderBy, setDoc, increment, runTransaction, getDoc, where, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";

// Declaración de variables globales (serán asignadas dentro de setupApp)
let app, auth, db, storage;
let appId = null; // <-- NUEVA VARIABLE GLOBAL PARA EL APP ID

let currentUser = null;
let activeListeners = [];
function cleanupListeners() {
    activeListeners.forEach(unsubscribe => unsubscribe());
    activeListeners = [];
}

// --- FUNCIÓN DE INICIALIZACIÓN ASÍNCRONA SEGURA (INICIO DE LA APP) ---
async function setupApp() {
    // Definimos las variables de vistas localmente (tomadas del HTML)
    const loadingView = document.getElementById('loading-view');
    const loginView = document.getElementById('login-view');
    const appContainer = document.getElementById('app-container');

    try {
        // 1. Petición SEGURA a la Cloud Function para obtener la config
        const response = await fetch('/firebase-config.json');
        if (!response.ok) {
            throw new Error(`Error ${response.status}: No se pudo obtener la configuración.`);
        }
        const firebaseConfig = await response.json();
        
        // ASIGNACIÓN CRÍTICA: Guardar el appId globalmente para Firestore
        appId = firebaseConfig.appId;

        // 2. Inicializa Firebase con la configuración cargada
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);

        // 3. Lógica de Autenticación (ÚNICA)
        setPersistence(auth, browserLocalPersistence);
        onAuthStateChanged(auth, user => {
            cleanupListeners();
            loadingView.classList.add('hidden');
            if (user) {
                currentUser = user;
                loginView.classList.add('hidden');
                appContainer.classList.remove('hidden');
                showView('main-menu-view');
                // Inicializa Listeners después de la autenticación
                listenToSocios();
                listenToHistory();
                listenToArticles();
                listenToSociosForTPV();
                listenToArticlesForTPV();
            } else {
                currentUser = null;
                appContainer.classList.add('hidden');
                loginView.classList.remove('hidden');
            }
        });

    } catch (error) {
        console.error("Fallo la inicialización completa de la app:", error);
        loadingView.innerHTML = '<p class="text-xl text-red-500">Error Crítico: No se pudo cargar la configuración de la aplicación.</p>';
    }
}

// Llamada para iniciar el proceso
setupApp();

// --- GESTIÓN DE VISTAS (resto de tu código que sigue...) ---
// Las variables de vistas están declaradas aquí, como las tenías originalmente.
const views = document.querySelectorAll('.view');
const menuItems = document.querySelectorAll('.menu-item');
const viewTitle = document.getElementById('view-title');
const backToMenuBtn = document.getElementById('back-to-menu');
const loadingView = document.getElementById('loading-view');
const loginView = document.getElementById('login-view');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');

function showView(viewId) {
    views.forEach(view => view.classList.add('hidden'));
    const activeView = document.getElementById(viewId);
    if (activeView) {
        activeView.classList.remove('hidden');

        const isMenuView = viewId === 'main-menu-view';
        backToMenuBtn.classList.toggle('hidden', isMenuView);

        if (isMenuView) {
            viewTitle.textContent = 'Menú Principal';
        } else {
            // Asume que la vista tiene un h2 con el título
            viewTitle.textContent = activeView.querySelector('h2') ? activeView.querySelector('h2').textContent : viewId;
        }

        // Si la vista es la de estadísticas, renderizar el gráfico
        if (viewId === 'stats-view') {
            renderizarGraficoDispensas();
        }
    }
}

menuItems.forEach(item => {
    item.addEventListener('click', () => {
        const viewId = item.dataset.view;
        showView(viewId);
    });
});

backToMenuBtn.addEventListener('click', () => showView('main-menu-view'));

// --- LÓGICA DE AUTENTICACIÓN (FORMULARIOS) ---

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const loginError = document.getElementById('login-error');
    loginError.textContent = '';
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        loginError.textContent = 'Credenciales incorrectas.';
        console.error("Login Error:", error);
    }
});

logoutButton.addEventListener('click', () => {
    cleanupListeners();
    signOut(auth);
});

// --- MÓDULO DE SOCIOS ---
const sociosList = document.getElementById('socios-list');
const addSocioModalOverlay = document.getElementById('add-socio-modal-overlay');
const addSocioForm = document.getElementById('add-socio-form');
const socioIdPhotoInput = document.getElementById('socio-id-photo');
const closeAddSocioModalBtn = document.getElementById('close-add-socio-modal');
const cancelAddSocioBtn = document.getElementById('cancel-add-socio');
const socioDetailsModalOverlay = document.getElementById('socio-details-modal-overlay');
const socioDetailsModalTitle = document.getElementById('socio-details-modal-title');
const socioDetailsContent = document.getElementById('socio-details-content');
const closeSocioDetailsModalBtn = document.getElementById('close-socio-details-modal');

async function showPartnerDetails(socioId, socioNombre) {
    socioDetailsModalTitle.textContent = `Historial de ${socioNombre}`;
    socioDetailsModalOverlay.classList.remove('hidden');
    socioDetailsContent.innerHTML = '<p class="text-center p-8">Cargando historial...</p>';

    try {
        const dispensasRef = collection(db, "dispensas");
        const q = query(dispensasRef, where("idSocio", "==", socioId), orderBy("fecha", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            socioDetailsContent.innerHTML = '<p class="text-center p-8 text-gray-400">Este socio no tiene dispensas registradas.</p>';
            return;
        }

        let html = '<div class="space-y-3">';
        querySnapshot.forEach(doc => {
            const dispensa = doc.data();
            const fecha = formatFirebaseTimestamp(dispensa.fecha);
            html += `
                <div class="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                    <div>
                        <p class="font-semibold">${dispensa.nombreArticulo}</p>
                        <p class="text-sm text-gray-400">${fecha}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-green-400">${dispensa.precioTotal.toFixed(2)} €</p>
                        <p class="text-sm text-gray-300">Cantidad: ${dispensa.cantidad}</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        socioDetailsContent.innerHTML = html;

    } catch (error) {
        console.error("Error al obtener el historial del socio:", error);
        socioDetailsContent.innerHTML = '<p class="text-center p-8 text-red-500">No se pudo cargar el historial. Inténtalo de nuevo.</p>';
        showToast("Error al cargar el historial.", true);
    }
}

function closeSocioDetailsModal() {
    socioDetailsModalOverlay.classList.add('hidden');
    socioDetailsContent.innerHTML = '<p class="text-center p-8">Cargando historial...</p>'; // Reset content
}

closeSocioDetailsModalBtn.addEventListener('click', closeSocioDetailsModal);
socioDetailsModalOverlay.addEventListener('click', (e) => {
    if (e.target === socioDetailsModalOverlay) {
        closeSocioDetailsModal();
    }
});

// FUNCIÓN CRÍTICA CORREGIDA PARA USAR APP ID
function getSociosCollectionRef() {
    if (!currentUser || !appId) {
        console.error("User not logged in or App ID not available");
        return null;
    }
    // RUTA COMPLEJA ORIGINAL RECONSTRUIDA CON LA VARIABLE appId global
    return collection(db, `artifacts/${appId}/users/${currentUser.uid}/socios`);
}
// -------------------------------------------

function optimizeImage(file, maxSize = 1024, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality);
            };
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function listenToSocios() {
    const sociosCollectionRef = getSociosCollectionRef();
    if (!sociosCollectionRef) return;

    const q = query(sociosCollectionRef, orderBy("apellido", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        sociosList.innerHTML = '';
        if (snapshot.empty) {
            sociosList.innerHTML = '<tr><td colspan="4" class="py-4 px-6 text-center text-gray-500">No hay socios registrados.</td></tr>';
            return;
        }
        snapshot.forEach(doc => {
            const socio = doc.data();
            const hoy = new Date();
            let estadoFinal = socio.estado;
            let filaClass = '';

            if (socio.estado === 'Verde' && socio.fecha_caducidad_pago && socio.fecha_caducidad_pago.toDate() < hoy) {
                estadoFinal = 'Gris';
                filaClass = 'bg-yellow-900'; // Highlight expired
            }

            const statusInfo = {
                'Gris': { color: 'bg-gray-500', text: 'Pendiente' },
                'Rojo': { color: 'bg-red-500', text: 'Non Grata' },
                'Verde': { color: 'bg-green-500', text: 'Pagado' }
            };
            const currentStatus = statusInfo[estadoFinal];

            const socioElement = `
                <tr class="${filaClass} border-b border-gray-700">
                    <td class="py-4 px-6">${socio.nombre}</td>
                    <td class="py-4 px-6">${socio.apellido}</td>
                    <td class="py-4 px-6">
                        <span class="px-2 py-1 font-semibold leading-tight text-white rounded-full ${currentStatus.color}">
                            ${currentStatus.text}
                        </span>
                    </td>
                    <td class="py-4 px-6">
                        <button data-id="${doc.id}" data-estado="${socio.estado}" class="change-status-btn text-blue-400 hover:underline">Cambiar Estado</button>
                        <button data-id="${doc.id}" data-nombre="${socio.nombre} ${socio.apellido}" data-url="${socio.url_foto_id}" class="view-details-btn text-blue-400 hover:underline ml-4">Ver Detalles</button>
                    </td>
                </tr>
            `;
            sociosList.innerHTML += socioElement;
        });
    });
    activeListeners.push(unsubscribe);
}

addSocioForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validación
    const nombre = document.getElementById('socio-nombre').value.trim();
    const apellido = document.getElementById('socio-apellido').value.trim();
    const file = socioIdPhotoInput.files[0];
    let isValid = true;

    // Limpiar errores previos
    document.getElementById('error-nombre').textContent = '';
    document.getElementById('error-apellido').textContent = '';
    document.getElementById('error-foto').textContent = '';
    document.getElementById('form-error').classList.add('hidden');

    if (!nombre) {
        document.getElementById('error-nombre').textContent = 'El nombre es obligatorio.';
        isValid = false;
    }
    if (!apellido) {
        document.getElementById('error-apellido').textContent = 'El apellido es obligatorio.';
        isValid = false;
    }
    if (!file) {
        document.getElementById('error-foto').textContent = 'La foto del DNI es obligatoria.';
        isValid = false;
    }

    if (!isValid) return;

    const submitBtn = document.getElementById('submit-socio-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.spinner');

    // --- Feedback de envío ---
    submitBtn.disabled = true;
    btnText.textContent = 'Guardando...';
    spinner.classList.remove('hidden');

    try {
        const sociosCollectionRef = getSociosCollectionRef();
        if (!sociosCollectionRef) {
            throw new Error('Error de autenticación. Inténtalo de nuevo.');
        }

        // Step 1: Create the document in Firestore to get an ID
        const newSocioRef = doc(sociosCollectionRef);

        const newSocioData = {
            nombre,
            apellido,
            estado: 'Gris',
            fecha_ingreso: serverTimestamp(),
            fecha_caducidad_pago: null,
            url_foto_id: '' // Initialize with empty string
        };

        // Set the initial data
        await setDoc(newSocioRef, newSocioData);

        // Step 2: If there's a file, optimize and upload it
        if (file) {
            const optimizedBlob = await optimizeImage(file);
            const storageRef = ref(storage, `socios_ids/${newSocioRef.id}.jpg`);
            await uploadBytes(storageRef, optimizedBlob);

            // Step 3: Get the download URL
            const downloadURL = await getDownloadURL(storageRef);

            // Step 4: Update the document with the URL
            await updateDoc(newSocioRef, {
                url_foto_id: downloadURL
            });
        }

        showToast('Socio añadido correctamente.');
        closeSocioModal();

    } catch (error) {
        console.error("Error al guardar el socio:", error);
        showToast('Error al guardar el socio.', true);
        document.getElementById('form-error').textContent = error.message;
        document.getElementById('form-error').classList.remove('hidden');
    } finally {
        // --- Restaurar botón ---
        submitBtn.disabled = false;
        btnText.textContent = 'Guardar';
        spinner.classList.add('hidden');
    }
});

sociosList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('change-status-btn')) {
        const socioId = e.target.dataset.id;
        let currentEstado = e.target.dataset.estado;
        let newEstado;
        let fechaCaducidad = null;

        if (currentEstado === 'Gris') {
            newEstado = 'Verde';
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 365);
            fechaCaducidad = futureDate;
        } else if (currentEstado === 'Verde') {
            newEstado = 'Rojo';
        } else { // Rojo
            newEstado = 'Gris';
        }

        const sociosCollectionRef = getSociosCollectionRef();
        if (!sociosCollectionRef) return;

        const socioRef = doc(sociosCollectionRef, socioId);
        await updateDoc(socioRef, {
            estado: newEstado,
            fecha_caducidad_pago: fechaCaducidad
        });
    }

    if (e.target.classList.contains('view-details-btn')) {
        const socioId = e.target.dataset.id;
        const socioNombre = e.target.dataset.nombre;
        showPartnerDetails(socioId, socioNombre);
    }
});

document.getElementById('close-view-id-modal').addEventListener('click', () => {
    document.getElementById('view-id-modal').classList.add('hidden');
});

// --- TOAST NOTIFICATION ---
function showToast(message, isError = false) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const baseClasses = 'p-4 rounded-lg shadow-lg text-white mb-2 transition-all duration-300';
    const bgColor = isError ? 'bg-red-600' : 'bg-green-600';
    toast.className = `${baseClasses} ${bgColor}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function closeSocioModal() {
    addSocioForm.reset();
    addSocioModalOverlay.classList.add('hidden');
    // Limpiar errores
    document.getElementById('error-nombre').textContent = '';
    document.getElementById('error-apellido').textContent = '';
    document.getElementById('error-foto').textContent = '';
    document.getElementById('form-error').classList.add('hidden');
}

document.getElementById('show-add-socio-modal').addEventListener('click', () => addSocioModalOverlay.classList.remove('hidden'));

cancelAddSocioBtn.addEventListener('click', closeSocioModal);
closeAddSocioModalBtn.addEventListener('click', closeSocioModal);

addSocioModalOverlay.addEventListener('click', (e) => {
    if (e.target === addSocioModalOverlay) {
        closeSocioModal();
    }
});

// --- MÓDULO DE ARTÍCULOS (STOCK) ---
const formArticulo = document.getElementById('form-articulo');
const listaArticulosContainer = document.getElementById('lista-articulos-container');
const categoriasDatalist = document.getElementById('categorias-datalist');
const loadStockModalOverlay = document.getElementById('load-stock-modal-overlay');
const loadStockModalTitle = document.getElementById('load-stock-modal-title');
const loadStockForm = document.getElementById('load-stock-form');
const cancelLoadStockBtn = document.getElementById('cancel-load-stock');
let currentArticleForStockLoad = null;

function openLoadStockModal(articleId, articleName) {
    currentArticleForStockLoad = { id: articleId, nombre: articleName };
    loadStockModalTitle.textContent = `Cargando stock para: ${articleName}`;
    loadStockModalOverlay.classList.remove('hidden');
}

function closeLoadStockModal() {
    loadStockForm.reset();
    currentArticleForStockLoad = null;
    loadStockModalOverlay.classList.add('hidden');
}

listaArticulosContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('load-stock-btn')) {
        const articleId = e.target.dataset.id;
        const articleName = e.target.dataset.nombre;
        openLoadStockModal(articleId, articleName);
    }
});

cancelLoadStockBtn.addEventListener('click', closeLoadStockModal);
loadStockModalOverlay.addEventListener('click', (e) => {
    if (e.target === loadStockModalOverlay) {
        closeLoadStockModal();
    }
});

loadStockForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentArticleForStockLoad) return;

    const cantidadInput = document.getElementById('stock-cantidad-input');
    const cantidad = Number(cantidadInput.value);

    if (!cantidad || cantidad <= 0) {
        showToast("Por favor, introduce una cantidad positiva.", true);
        return;
    }

    const { id: articleId, nombre: articleName } = currentArticleForStockLoad;
    const articleRef = doc(db, "articulos", articleId);

    try {
        // 1. Actualizar stock atómicamente
        await updateDoc(articleRef, {
            stock: increment(cantidad)
        });

        // 2. Registrar en historial
        await addDoc(collection(db, "historial"), {
            tipo: "recarga",
            descripcion: `Recarga de ${cantidad} uds. de "${articleName}"`,
            fecha: serverTimestamp()
        });

        showToast(`Stock de "${articleName}" actualizado con éxito.`);
        closeLoadStockModal();
    } catch (error) {
        console.error("Error updating stock: ", error);
        showToast("Error al actualizar el stock.", true);
    }
});

function listenToArticles() {
    // FIX: Se elimina el orden compuesto para no depender de un índice de Firestore.
    // El orden se aplica ahora en el lado del cliente.
    const q = query(collection(db, "articulos"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            listaArticulosContainer.innerHTML = '<p class="text-gray-500 text-center">No hay artículos en el inventario.</p>';
            return;
        }

        const allCategories = new Set();
        const articulosPorCategoria = snapshot.docs.reduce((acc, doc) => {
            const article = { id: doc.id, ...doc.data() };
            const category = article.categoria || 'Sin Categoría';
            allCategories.add(category);
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(article);
            return acc;
        }, {});

        // Ordenar artículos dentro de cada categoría por nombre
        for (const category in articulosPorCategoria) {
            articulosPorCategoria[category].sort((a, b) => a.nombre.localeCompare(b.nombre));
        }

        // Actualizar Datalist con categorías ordenadas
        categoriasDatalist.innerHTML = '';
        Array.from(allCategories).sort().forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            categoriasDatalist.appendChild(option);
        });

        listaArticulosContainer.innerHTML = '';

        // Obtener y ordenar las claves de categoría para renderizar en orden
        const sortedCategories = Object.keys(articulosPorCategoria).sort((a, b) => a.localeCompare(b));

        for (const category of sortedCategories) {
            const categoryContainer = document.createElement('div');
            categoryContainer.className = 'bg-gray-800 p-4 rounded-lg';

            const categoryTitle = document.createElement('h2');
            categoryTitle.className = 'text-xl font-semibold mb-3 text-blue-400 border-b border-gray-700 pb-2';
            categoryTitle.textContent = category;
            categoryContainer.appendChild(categoryTitle);

            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'space-y-2 mt-3';

            articulosPorCategoria[category].forEach(article => {
                const articleElement = document.createElement('div');
                articleElement.className = 'grid grid-cols-1 sm:grid-cols-4 items-center gap-4 p-2 rounded-md hover:bg-gray-700/50';
                articleElement.dataset.id = article.id;

                const precio = article.precioPorUnidad || 0;
                const stock = article.stock || 0;

                articleElement.innerHTML = `
                    <div class="sm:col-span-2">
                        <p class="font-medium">${article.nombre}</p>
                        <p class="text-xs text-gray-400">Categoría: ${article.categoria} | Precio: ${precio.toFixed(2)}€</p>
                    </div>
                    <p>Stock: <span class="font-bold">${stock}</span></p>
                    <div class="sm:col-span-1 sm:text-right">
                        <button data-id="${article.id}" data-nombre="${article.nombre}" class="load-stock-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                            Cargar Stock
                        </button>
                    </div>
                `;
                itemsContainer.appendChild(articleElement);
            });

            categoryContainer.appendChild(itemsContainer);
            listaArticulosContainer.appendChild(categoryContainer);
        }
    });
    activeListeners.push(unsubscribe);
}

formArticulo.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('article-nombre').value.trim();
    const categoria = document.getElementById('article-categoria').value.trim();
    const unidadMinimaVenta = Number(document.getElementById('article-unidad').value);
    const precioPorUnidad = Number(document.getElementById('article-precio').value);

    if (!nombre || !categoria || !unidadMinimaVenta || precioPorUnidad < 0) {
        showToast("Por favor, completa todos los campos correctamente.", true);
        return;
    }

    try {
        await addDoc(collection(db, "articulos"), {
            nombre,
            categoria,
            unidadMinimaVenta,
            precioPorUnidad,
            stock: 0,
            createdAt: serverTimestamp()
        });
        showToast(`Artículo "${nombre}" añadido con éxito.`);
        formArticulo.reset();
    } catch (error) {
        console.error("Error adding article: ", error);
        showToast("Hubo un error al añadir el artículo.", true);
    }
});


// --- MÓDULO DE TPV ---
const tpvSocioSelect = document.getElementById('tpv-socio-select');
const tpvArticuloSelect = document.getElementById('tpv-articulo-select');
const tpvCantidadInput = document.getElementById('tpv-cantidad');
const resumenSocio = document.getElementById('resumen-socio');
const resumenArticulo = document.getElementById('resumen-articulo');
const resumenCantidad = document.getElementById('resumen-cantidad');
const resumenTotal = document.getElementById('resumen-total');
const realizarDispensaBtn = document.getElementById('realizar-dispensa-btn');

function listenToSociosForTPV() {
    const sociosCollectionRef = getSociosCollectionRef();
    if (!sociosCollectionRef) return;

    const q = query(sociosCollectionRef, orderBy("apellido", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const currentSelection = tpvSocioSelect.value;
        tpvSocioSelect.innerHTML = '<option disabled selected value="">Seleccione un socio...</option>';
        snapshot.forEach(doc => {
            const socio = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${socio.nombre} ${socio.apellido}`;
            tpvSocioSelect.appendChild(option);
        });
        if (currentSelection) {
            tpvSocioSelect.value = currentSelection;
        }
    });
    activeListeners.push(unsubscribe);
}

function listenToArticlesForTPV() {
    const q = query(collection(db, "articulos"), orderBy("nombre"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const currentSelection = tpvArticuloSelect.value;
        tpvArticuloSelect.innerHTML = '<option disabled selected value="">Seleccione un artículo...</option>';
        snapshot.forEach(doc => {
            const article = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = article.nombre;
            option.dataset.precio = article.precioPorUnidad || 0;
            tpvArticuloSelect.appendChild(option);
        });
        if (currentSelection) {
            tpvArticuloSelect.value = currentSelection;
        }
    });
    activeListeners.push(unsubscribe);
}

function actualizarResumenTPV() {
    const socioId = tpvSocioSelect.value;
    const articuloId = tpvArticuloSelect.value;
    const cantidad = parseInt(tpvCantidadInput.value, 10);

    const isSocioValid = socioId && socioId !== "";
    const isArticuloValid = articuloId && articuloId !== "";
    const isCantidadValid = !isNaN(cantidad) && cantidad > 0;

    if (isSocioValid) {
        resumenSocio.textContent = tpvSocioSelect.options[tpvSocioSelect.selectedIndex].text;
    } else {
        resumenSocio.textContent = '--';
    }

    if (isArticuloValid) {
        resumenArticulo.textContent = tpvArticuloSelect.options[tpvArticuloSelect.selectedIndex].text;
    } else {
        resumenArticulo.textContent = '--';
    }

    if (isCantidadValid) {
        resumenCantidad.textContent = cantidad;
    } else {
        resumenCantidad.textContent = '--';
    }

    const allValid = isSocioValid && isArticuloValid && isCantidadValid;

    if (allValid) {
        const selectedArticuloOption = tpvArticuloSelect.options[tpvArticuloSelect.selectedIndex];
        const precioUnitario = parseFloat(selectedArticuloOption.dataset.precio || 0);
        const total = cantidad * precioUnitario;
        resumenTotal.textContent = `${total.toFixed(2)} €`;
        realizarDispensaBtn.disabled = false;
    } else {
        resumenTotal.textContent = '0.00 €';
        realizarDispensaBtn.disabled = true;
    }
}

tpvSocioSelect.addEventListener('change', actualizarResumenTPV);
tpvArticuloSelect.addEventListener('change', actualizarResumenTPV);
tpvCantidadInput.addEventListener('input', actualizarResumenTPV);

async function procesarDispensa() {
    const idSocioSeleccionado = tpvSocioSelect.value;
    const idArticuloSeleccionado = tpvArticuloSelect.value;
    const cantidadDispensada = parseInt(tpvCantidadInput.value, 10);

    const nombreSocio = tpvSocioSelect.options[tpvSocioSelect.selectedIndex].text;
    const selectedArticuloOption = tpvArticuloSelect.options[tpvArticuloSelect.selectedIndex];
    const nombreArticulo = selectedArticuloOption.text;
    const precioUnitario = parseFloat(selectedArticuloOption.dataset.precio || 0);
    const aporteTotalCalculado = cantidadDispensada * precioUnitario;

    realizarDispensaBtn.disabled = true;
    realizarDispensaBtn.textContent = "Procesando...";

    try {
        await runTransaction(db, async (transaction) => {
            const articuloRef = doc(db, "articulos", idArticuloSeleccionado);
            const sociosCollectionRef = getSociosCollectionRef();
            if (!sociosCollectionRef) {
                throw new Error("No se pudo obtener la referencia a la colección de socios.");
            }
            const socioRef = doc(sociosCollectionRef, idSocioSeleccionado);

            // 1. Leer el stock y el socio DENTRO de la transacción
            const articuloDoc = await transaction.get(articuloRef);
            const socioDoc = await transaction.get(socioRef);

            if (!articuloDoc.exists()) {
                throw "El artículo ya no existe.";
            }
            if (!socioDoc.exists()) {
                throw "El socio ya no existe.";
            }

            const stockActual = articuloDoc.data().stock;

            // 2. Validar el stock
            if (stockActual < cantidadDispensada) {
                throw "Stock insuficiente para realizar la dispensa.";
            }

            // 3. Si hay stock, realizar las operaciones de escritura
            const nuevoStock = stockActual - cantidadDispensada;
            transaction.update(articuloRef, { stock: nuevoStock });

            // 4. Crear el registro en la colección 'dispensas'
            const dispensaRef = doc(collection(db, "dispensas")); // Crea una referencia para un nuevo doc
            transaction.set(dispensaRef, {
                idSocio: idSocioSeleccionado,
                idArticulo: idArticuloSeleccionado,
                nombreArticulo: nombreArticulo,
                nombreSocio: nombreSocio,
                cantidad: cantidadDispensada,
                precioTotal: aporteTotalCalculado,
                fecha: serverTimestamp()
            });

            // 5. Crear el registro en la colección 'historial'
            const historialRef = doc(collection(db, "historial"));
            transaction.set(historialRef, {
                tipo: 'dispensa',
                descripcion: `Dispensa de ${cantidadDispensada} uds. de "${nombreArticulo}" a "${nombreSocio}"`,
                fecha: serverTimestamp()
            });
        });

        showToast("¡Dispensa realizada con éxito!");
        // Resetear formulario TPV
        tpvSocioSelect.value = '';
        tpvArticuloSelect.value = '';
        tpvCantidadInput.value = '';
        actualizarResumenTPV();

    } catch (error) {
        console.error("Error en la transacción: ", error);
        showToast(typeof error === 'string' ? error : "Error al procesar la dispensa.", true);
    } finally {
        realizarDispensaBtn.disabled = false;
        realizarDispensaBtn.textContent = "REALIZAR DISPENSA";
        actualizarResumenTPV(); // Re-evalúa el estado del botón
    }
}

realizarDispensaBtn.addEventListener('click', procesarDispensa);


// --- MÓDULO DE HISTORIAL ---
const historialContainer = document.getElementById('historial-container');

/**
 * Formatea un objeto Timestamp de Firestore a un string legible.
 * Ejemplo: "16 de Octubre de 2025, 14:30"
 * @param {object} timestamp - El objeto Timestamp de Firestore.
 * @returns {string} La fecha formateada o un texto alternativo.
 */
function formatFirebaseTimestamp(timestamp) {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
        return 'Fecha no disponible';
    }
    const date = timestamp.toDate();
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('es-ES', options);
}

function listenToHistory() {
    const q = query(collection(db, "historial"), orderBy("fecha", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        historialContainer.innerHTML = ''; // Limpiar el contenedor antes de renderizar
        if (snapshot.empty) {
            historialContainer.innerHTML = '<p class="text-center text-gray-500">Aún no hay operaciones registradas.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const evento = doc.data();
            const formattedDate = formatFirebaseTimestamp(evento.fecha);

            // Determinar el estilo y el icono según el tipo de evento
            const isDispensa = evento.tipo === 'dispensa';
            const borderColorClass = isDispensa ? 'border-blue-500' : 'border-green-500';
            const icon = isDispensa ? '🛒' : '📦';

            // Crear el elemento del historial
            const eventoElement = document.createElement('div');
            eventoElement.className = `bg-gray-800 p-4 rounded-lg flex items-start gap-4 ${borderColorClass} border-l-4`;

            eventoElement.innerHTML = `
                <div class="text-2xl mt-1">${icon}</div>
                <div class="flex-grow">
                    <p class="text-white">${evento.descripcion}</p>
                    <p class="text-sm text-gray-400 mt-1">${formattedDate}</p>
                </div>
            `;

            historialContainer.appendChild(eventoElement);
        });
    });
    activeListeners.push(unsubscribe);
}

// --- MÓDULO DE ESTADÍSTICAS (GRÁFICOS) ---
let dispensasChartInstance = null;
async function renderizarGraficoDispensas() {
    const ctx = document.getElementById('grafico-ventas-semanal').getContext('2d');

    // 1. Destruir instancia de gráfico anterior si existe
    if (dispensasChartInstance) {
        dispensasChartInstance.destroy();
    }

    try {
        // 2. Calcular el rango de fechas (últimos 7 días)
        const hoy = new Date();
        const fechaHace7Dias = new Date();
        fechaHace7Dias.setDate(hoy.getDate() - 7);
        fechaHace7Dias.setHours(0, 0, 0, 0); // Empezar desde el inicio del día

        // 3. Consultar TODAS las dispensas y filtrar en el cliente para evitar problemas de índices
        const dispensasRef = collection(db, "dispensas");
        const q = query(dispensasRef); // Sin filtro 'where'
        const querySnapshot = await getDocs(q);

        // 4. Procesar y agregar datos por día
        const dispensasPorDia = {}; // { 'YYYY-MM-DD': total, ... }
        querySnapshot.forEach(doc => {
            const dispensa = doc.data();
            if (dispensa.fecha && dispensa.fecha.toDate) {
                const fechaDispensa = dispensa.fecha.toDate();

                // Filtrado en el lado del cliente
                if (fechaDispensa >= fechaHace7Dias) {
                    // Formato YYYY-MM-DD para usar como clave
                    const diaKey = fechaDispensa.toISOString().split('T')[0];

                    if (!dispensasPorDia[diaKey]) {
                        dispensasPorDia[diaKey] = 0;
                    }
                    dispensasPorDia[diaKey] += dispensa.precioTotal;
                }
            }
        });

        // 5. Preparar labels y data para el gráfico
        const labels = [];
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0,0,0,0);
            const diaKey = d.toISOString().split('T')[0];
            // Formatear la label para mostrar en el gráfico (ej: Oct 16)
            const labelFormatted = d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

            labels.push(labelFormatted);
            data.push(dispensasPorDia[diaKey] || 0);
        }

        // 6. Renderizar el nuevo gráfico
        dispensasChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Dispensado (€)',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#9CA3AF' // Color de los ticks del eje Y (gris claro)
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)' // Color de las líneas de la cuadrícula
                        }
                    },
                    x: {
                        ticks: {
                            color: '#9CA3AF' // Color de los ticks del eje X
                        },
                         grid: {
                            color: 'rgba(255, 255, 255, 0.1)' // Color de las líneas de la cuadrícula
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#E5E7EB' // Color del texto de la leyenda
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error renderizando el gráfico de dispensas:", error);
        // Opcional: Mostrar un mensaje de error en el canvas
        ctx.font = "16px Arial";
        ctx.fillStyle = "red";
        ctx.textAlign = "center";
        ctx.fillText("No se pudieron cargar los datos del gráfico.", ctx.canvas.width / 2, 50);
    }
}