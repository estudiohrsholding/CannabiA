// ------------------------------------------------------------------
// Firebase Configuration
// ------------------------------------------------------------------
// IMPORTANTE: Reemplaza esto con la configuración de tu proyecto Firebase
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ------------------------------------------------------------------
// Variables Globales y Selectores de DOM
// ------------------------------------------------------------------
const loginView = document.getElementById('login-view');
const mainContent = document.getElementById('main-content');
const mainPageTitle = document.getElementById('main-page-title');
const appContainer = document.getElementById('app-container');

// Vistas
const views = document.querySelectorAll('.view');

// Botones
const logoutButton = document.getElementById('logout-button');

// ------------------------------------------------------------------
// Gestión de Vistas
// ------------------------------------------------------------------
const showView = (viewId) => {
    views.forEach(view => {
        view.classList.remove('active');
    });
    const activeView = document.getElementById(viewId);
    if (activeView) {
        activeView.classList.add('active');
        // Actualizar título principal
        if (viewId === 'main-menu-view') {
            mainPageTitle.textContent = 'Menú Principal';
        } else if (viewId === 'socios-section') {
            mainPageTitle.textContent = 'Socios';
        } else if (viewId === 'articulos-section') {
            mainPageTitle.textContent = 'Artículos';
        } else if (viewId === 'historial-section') {
            mainPageTitle.textContent = 'Historial';
        } else if (viewId === 'tpv-section') {
            mainPageTitle.textContent = 'Punto de Dispensa';
        }
    }
};

// ------------------------------------------------------------------
// Gestión de Modales (con animación)
// ------------------------------------------------------------------
const openModal = (modalId) => {
    const modalOverlay = document.getElementById(`${modalId}-overlay`);
    if (modalOverlay) {
        modalOverlay.classList.add('open');
        // Forzamos un reflow para que la transición se aplique
        void modalOverlay.offsetWidth;
        modalOverlay.querySelector('.modal-content').classList.add('open');
    }
};

const closeModal = (modalId) => {
    const modalOverlay = document.getElementById(`${modalId}-overlay`);
    if (modalOverlay) {
        modalOverlay.querySelector('.modal-content').classList.remove('open');
        modalOverlay.classList.remove('open');
    }
};

// Event listeners para cerrar modales
document.querySelectorAll('[id^="cancel-"], [id^="close-"]').forEach(button => {
    button.addEventListener('click', () => {
        const modalId = button.closest('.modal-overlay').id.replace('-overlay', '');
        closeModal(modalId);
    });
});


// ------------------------------------------------------------------
// Notificaciones Toast (con icono)
// ------------------------------------------------------------------
const showToast = (message, isError = false) => {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    toastMessage.textContent = message;

    // Iconos SVG
    const successIcon = `<svg class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    const errorIcon = `<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

    toastIcon.innerHTML = isError ? errorIcon : successIcon;
    toast.className = `fixed bottom-5 right-5 text-white py-3 px-5 rounded-lg shadow-lg flex items-center space-x-3 transform transition-all duration-300 ${isError ? 'bg-red-800' : 'bg-slate-700'} translate-y-0 opacity-100`;

    setTimeout(() => {
        toast.className = toast.className.replace('translate-y-0 opacity-100', 'translate-y-20 opacity-0');
    }, 3000);
};


// ------------------------------------------------------------------
// Autenticación
// ------------------------------------------------------------------
auth.onAuthStateChanged(user => {
    if (user) {
        // Usuario logueado
        loginView.classList.remove('active');
        mainContent.classList.remove('hidden');
        showView('main-menu-view');
    } else {
        // Usuario no logueado
        loginView.classList.add('active');
        mainContent.classList.add('hidden');
        views.forEach(view => view.classList.remove('active'));
    }
});

// Login
const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            console.error("Error de login:", error);
            showToast(`Error: ${error.message}`, true);
        });
});

// Logout
logoutButton.addEventListener('click', () => {
    auth.signOut();
});

// ------------------------------------------------------------------
// Navegación Principal
// ------------------------------------------------------------------
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
        const viewId = item.getAttribute('data-view');
        showView(viewId);
    });
});

document.querySelectorAll('.back-to-menu').forEach(button => {
    button.addEventListener('click', () => {
        showView('main-menu-view');
    });
});


// ------------------------------------------------------------------
// Funciones Helper
// ------------------------------------------------------------------

// Formatear Timestamps de Firebase
const formatFirebaseTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate();
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('es-ES', options);
};

// Mostrar/Ocultar Spinner en botones
const setButtonLoading = (button, isLoading, text) => {
    const buttonText = button.querySelector('.button-text');
    const spinner = button.querySelector('.spinner');

    if (isLoading) {
        button.disabled = true;
        if(buttonText) buttonText.textContent = text || 'Guardando...';
        if(spinner) spinner.classList.remove('hidden');
    } else {
        button.disabled = false;
        if(buttonText) buttonText.textContent = text;
        if(spinner) spinner.classList.add('hidden');
    }
};

// ------------------------------------------------------------------
// Módulo de Socios
// ------------------------------------------------------------------
const sociosList = document.getElementById('socios-list');
const addSocioButton = document.getElementById('add-socio-button');
const addFirstSocioButton = document.getElementById('add-first-socio-button');
const socioForm = document.getElementById('socio-form');
const socioModalTitle = document.getElementById('socio-modal-title');
const saveSocioButton = document.getElementById('save-socio-button');

// Lógica para mostrar socios
const renderSocios = (socios) => {
    const skeletonLoader = document.getElementById('socios-skeleton-loader');
    const emptyState = document.getElementById('socios-empty-state');

    skeletonLoader.style.display = 'none';

    if (socios.length === 0) {
        emptyState.style.display = 'block';
        sociosList.innerHTML = '';
        return;
    }

    emptyState.style.display = 'none';
    sociosList.innerHTML = socios.map(socio => {
        const { id, nombre, status, fotoUrl, fecha_caducidad_pago } = socio;

        let statusColor = 'bg-gray-500';
        let statusText = 'Pendiente';

        const now = new Date();
        const expiryDate = fecha_caducidad_pago ? fecha_caducidad_pago.toDate() : null;

        if (status === 'Verde' && expiryDate && expiryDate > now) {
            statusColor = 'bg-emerald-500';
            statusText = 'Activo';
        } else if (status === 'Rojo') {
            statusColor = 'bg-red-500';
            statusText = 'Bloqueado';
        }

        return `
            <div class="socio-card bg-slate-800 p-4 rounded-lg flex items-center justify-between hover:bg-slate-700/50 transition-colors duration-200" data-id="${id}">
                <div class="flex items-center space-x-4">
                    <img src="${fotoUrl || 'https://via.placeholder.com/50'}" alt="Foto de ${nombre}" class="w-12 h-12 rounded-full object-cover">
                    <div>
                        <p class="font-bold text-lg">${nombre}</p>
                        <p class="text-sm text-slate-400">ID: ${id}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="px-3 py-1 text-sm font-semibold rounded-full ${statusColor} text-white">${statusText}</span>
                    <div class="dropdown">
                        <button class="text-slate-400 hover:text-white p-2 rounded-full">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                        </button>
                        <div class="dropdown-content">
                            <a href="#" class="view-details-btn" data-id="${id}">Ver Carnet</a>
                            <a href="#" class="edit-socio-btn" data-id="${id}">Editar</a>
                            <a href="#" class="change-status-btn" data-id="${id}" data-status="${status}">Cambiar Estado</a>
                            <a href="#" class="recharge-points-btn" data-id="${id}" data-nombre="${nombre}">Recargar Puntos</a>
                            <a href="#" class="delete-socio-btn text-red-400 hover:bg-red-500/20" data-id="${id}">Eliminar</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
};

// Cargar socios de Firestore
let unsubSocios;
auth.onAuthStateChanged(user => {
    if (user) {
        const skeletonLoader = document.getElementById('socios-skeleton-loader');
        skeletonLoader.style.display = 'block'; // Mostrar skeleton al inicio
        unsubSocios = db.collection('socios').orderBy('nombre').onSnapshot(snapshot => {
            const socios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderSocios(socios);
        }, err => {
            console.error(err);
            showToast("Error al cargar los socios.", true);
            skeletonLoader.style.display = 'none';
        });
    } else {
        if (unsubSocios) unsubSocios();
    }
});

// Abrir modal para añadir socio
addSocioButton.addEventListener('click', () => {
    socioForm.reset();
    socioModalTitle.textContent = 'Añadir Nuevo Socio';
    saveSocioButton.querySelector('.button-text').textContent = 'Guardar Socio';
    socioForm.dataset.editingId = '';
    openModal('socio-modal');
});
addFirstSocioButton.addEventListener('click', () => addSocioButton.click());


// Guardar o actualizar socio
socioForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editingId = socioForm.dataset.editingId;
    const nombre = document.getElementById('socio-nombre').value;
    const id = document.getElementById('socio-id').value;
    const puntos = Number(document.getElementById('socio-puntos').value);
    const fotoFile = document.getElementById('socio-foto-upload').files[0];
    let fotoUrl = document.getElementById('socio-foto-url').value;

    const button = saveSocioButton;
    setButtonLoading(button, true, 'Guardando...');

    try {
        // Subir imagen si se seleccionó un archivo
        if (fotoFile) {
            const filePath = `socios_fotos/${id}_${Date.now()}`;
            const fileRef = storage.ref(filePath);
            await fileRef.put(fotoFile);
            fotoUrl = await fileRef.getDownloadURL();
        }

        const socioData = {
            nombre,
            puntos,
            fotoUrl: fotoUrl || '',
        };

        if (editingId) {
            // Actualizar socio existente
            await db.collection('socios').doc(editingId).update(socioData);
            showToast('Socio actualizado correctamente.');
        } else {
            // Crear nuevo socio
            socioData.status = 'Verde'; // Por defecto
            socioData.fecha_alta = firebase.firestore.FieldValue.serverTimestamp();
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 365);
            socioData.fecha_caducidad_pago = firebase.firestore.Timestamp.fromDate(expiryDate);

            await db.collection('socios').doc(id).set(socioData);
            showToast('Socio añadido correctamente.');
        }

        closeModal('socio-modal');
        socioForm.reset();
    } catch (error) {
        console.error("Error guardando socio: ", error);
        showToast(`Error: ${error.message}`, true);
    } finally {
        setButtonLoading(button, false, editingId ? 'Guardar Cambios' : 'Guardar Socio');
    }
});


// Delegación de eventos para acciones de socio
sociosList.addEventListener('click', async (e) => {
    const target = e.target.closest('a');
    if (!target) return;

    const id = target.dataset.id;

    if (target.classList.contains('edit-socio-btn')) {
        e.preventDefault();
        const doc = await db.collection('socios').doc(id).get();
        if (doc.exists) {
            const socio = doc.data();
            document.getElementById('socio-nombre').value = socio.nombre;
            document.getElementById('socio-id').value = id;
            document.getElementById('socio-id').disabled = true; // No se puede editar el ID
            document.getElementById('socio-puntos').value = socio.puntos;
            document.getElementById('socio-foto-url').value = socio.fotoUrl;
            socioForm.dataset.editingId = id;
            socioModalTitle.textContent = 'Editar Socio';
            saveSocioButton.querySelector('.button-text').textContent = 'Guardar Cambios';
            openModal('socio-modal');
        }
    }

    // --- Ver Carnet Digital ---
    if (target.classList.contains('view-details-btn')) {
        e.preventDefault();
        const doc = await db.collection('socios').doc(id).get();
        if (doc.exists) {
            const socio = doc.data();
            const expiryDate = socio.fecha_caducidad_pago ? formatFirebaseTimestamp(socio.fecha_caducidad_pago).split(',')[0] : 'N/A';
            document.getElementById('details-socio-foto').src = socio.fotoUrl || 'https://via.placeholder.com/100';
            document.getElementById('details-socio-nombre').textContent = socio.nombre;
            document.getElementById('details-socio-id').textContent = id;
            document.getElementById('details-socio-caducidad').textContent = expiryDate;

            const qrcodeContainer = document.getElementById('qrcode');
            qrcodeContainer.innerHTML = ''; // Limpiar QR anterior
            new QRCode(qrcodeContainer, {
                text: id,
                width: 200,
                height: 200,
            });

            openModal('socio-details-modal');
        }
    }

    // --- Cambiar Estado ---
    if (target.classList.contains('change-status-btn')) {
        e.preventDefault();
        const currentStatus = target.dataset.status;
        const newStatus = currentStatus === 'Verde' ? 'Rojo' : 'Verde';
        const message = `¿Seguro que quieres cambiar el estado de este socio a ${newStatus === 'Verde' ? 'Activo' : 'Bloqueado'}?`;

        showConfirmationModal(message, async () => {
            try {
                const updateData = { status: newStatus };
                // Si se activa, se renueva la membresía por un año
                if (newStatus === 'Verde') {
                    const expiryDate = new Date();
                    expiryDate.setDate(expiryDate.getDate() + 365);
                    updateData.fecha_caducidad_pago = firebase.firestore.Timestamp.fromDate(expiryDate);
                }
                await db.collection('socios').doc(id).update(updateData);
                showToast('Estado del socio actualizado.');
            } catch (error) {
                console.error("Error cambiando estado: ", error);
                showToast(`Error: ${error.message}`, true);
            }
        });
    }

    // --- Recargar Puntos ---
    if (target.classList.contains('recharge-points-btn')) {
        e.preventDefault();
        document.getElementById('recharge-socio-id').value = id;
        document.getElementById('recharge-socio-name').textContent = target.dataset.nombre;
        openModal('recharge-points-modal');
    }

    // --- Eliminar Socio ---
    if (target.classList.contains('delete-socio-btn')) {
        e.preventDefault();
        showConfirmationModal('¿Seguro que quieres eliminar a este socio? Esta acción es irreversible.', async () => {
            try {
                await db.collection('socios').doc(id).delete();
                showToast('Socio eliminado correctamente.');
            } catch (error) {
                console.error("Error eliminando socio: ", error);
                showToast(`Error: ${error.message}`, true);
            }
        });
    }
});

// Búsqueda de socios
const searchSocioInput = document.getElementById('search-socio');
searchSocioInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    document.querySelectorAll('.socio-card').forEach(card => {
        const nombre = card.querySelector('p.font-bold').textContent.toLowerCase();
        const id = card.querySelector('p.text-sm').textContent.toLowerCase();
        if (nombre.includes(searchTerm) || id.includes(searchTerm)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
});

// Formulario de Recarga de Puntos
const rechargePointsForm = document.getElementById('recharge-points-form');
rechargePointsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const socioId = document.getElementById('recharge-socio-id').value;
    const amount = Number(document.getElementById('recharge-amount').value);

    if (amount <= 0) {
        showToast('La cantidad debe ser positiva.', true);
        return;
    }

    const socioRef = db.collection('socios').doc(socioId);

    try {
        await db.runTransaction(async (transaction) => {
            const socioDoc = await transaction.get(socioRef);
            if (!socioDoc.exists) throw "El socio no existe.";

            transaction.update(socioRef, {
                puntos: firebase.firestore.FieldValue.increment(amount)
            });

            const historialRef = db.collection('historial').doc();
            transaction.set(historialRef, {
                tipo: 'RECARGA',
                socioId,
                socioNombre: socioDoc.data().nombre,
                monto: amount,
                fecha: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        showToast('Puntos recargados correctamente.');
        closeModal('recharge-points-modal');
        rechargePointsForm.reset();

    } catch (error) {
        console.error("Error al recargar puntos:", error);
        showToast(`Error: ${error.message}`, true);
    }
});


// ------------------------------------------------------------------
// Módulo de Artículos
// ------------------------------------------------------------------
const articulosList = document.getElementById('articulos-list');
const addArticuloButton = document.getElementById('add-articulo-button');
const addFirstArticuloButton = document.getElementById('add-first-articulo-button');
const articuloForm = document.getElementById('articulo-form');
const articuloModalTitle = document.getElementById('articulo-modal-title');
const saveArticuloButton = document.getElementById('save-articulo-button');
const categoriasDatalist = document.getElementById('categorias-datalist');
const searchArticuloInput = document.getElementById('search-articulo');

// Renderizar artículos, agrupados por categoría
const renderArticulos = (articulos) => {
    const skeletonLoader = document.getElementById('articulos-skeleton-loader');
    const emptyState = document.getElementById('articulos-empty-state');
    skeletonLoader.style.display = 'none';

    if (articulos.length === 0) {
        emptyState.style.display = 'block';
        articulosList.innerHTML = '';
        return;
    }

    emptyState.style.display = 'none';
    const categorias = {};
    const categoriasSet = new Set(); // Para el datalist

    articulos.forEach(articulo => {
        if (!categorias[articulo.categoria]) {
            categorias[articulo.categoria] = [];
        }
        categorias[articulo.categoria].push(articulo);
        categoriasSet.add(articulo.categoria);
    });

    // Actualizar datalist para autocompletar
    categoriasDatalist.innerHTML = [...categoriasSet].map(cat => `<option value="${cat}">`).join('');

    articulosList.innerHTML = Object.keys(categorias).sort().map(categoria => `
        <div class="categoria-group">
            <h3 class="text-xl font-semibold text-emerald-400 mb-3 border-b border-slate-700 pb-2">${categoria}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${categorias[categoria].map(articulo => `
                    <div class="articulo-card bg-slate-800 p-4 rounded-lg flex justify-between items-start hover:bg-slate-700/50 transition-colors duration-200" data-nombre="${articulo.nombre.toLowerCase()}">
                        <div>
                            <p class="font-bold text-lg">${articulo.nombre}</p>
                            <p class="text-slate-300">${articulo.precio.toFixed(2)} €</p>
                            <p class="text-sm text-slate-400">Stock: ${articulo.stock}</p>
                        </div>
                        <div class="dropdown">
                             <button class="text-slate-400 hover:text-white p-2 rounded-full">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                            </button>
                            <div class="dropdown-content">
                                <a href="#" class="edit-articulo-btn" data-id="${articulo.id}">Editar</a>
                                <a href="#" class="delete-articulo-btn text-red-400 hover:bg-red-500/20" data-id="${articulo.id}">Eliminar</a>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
};


// Cargar artículos de Firestore
let unsubArticulos;
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('articulos-skeleton-loader').style.display = 'block';
        unsubArticulos = db.collection('articulos').orderBy('categoria').orderBy('nombre').onSnapshot(snapshot => {
            const articulos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderArticulos(articulos);
        }, err => {
            console.error(err);
            showToast("Error al cargar los artículos.", true);
            document.getElementById('articulos-skeleton-loader').style.display = 'none';
        });
    } else {
        if (unsubArticulos) unsubArticulos();
    }
});


// Abrir modal para añadir artículo
addArticuloButton.addEventListener('click', () => {
    articuloForm.reset();
    articuloModalTitle.textContent = 'Añadir Nuevo Artículo';
    saveArticuloButton.querySelector('.button-text').textContent = 'Guardar Artículo';
    articuloForm.dataset.editingId = '';
    openModal('articulo-modal');
});
addFirstArticuloButton.addEventListener('click', () => addArticuloButton.click());

// Guardar o actualizar artículo
articuloForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editingId = articuloForm.dataset.editingId;
    const nombre = document.getElementById('articulo-nombre').value;
    const categoria = document.getElementById('articulo-categoria').value;
    const precio = Number(document.getElementById('articulo-precio').value);
    const stock = Number(document.getElementById('articulo-stock').value);

    const button = saveArticuloButton;
    setButtonLoading(button, true);

    const articuloData = { nombre, categoria, precio, stock };

    try {
        if (editingId) {
            await db.collection('articulos').doc(editingId).update(articuloData);
            showToast('Artículo actualizado correctamente.');
        } else {
            await db.collection('articulos').add(articuloData);
            showToast('Artículo añadido correctamente.');
        }
        closeModal('articulo-modal');
        articuloForm.reset();
    } catch (error) {
        console.error("Error guardando artículo: ", error);
        showToast(`Error: ${error.message}`, true);
    } finally {
        setButtonLoading(button, false, editingId ? 'Guardar Cambios' : 'Guardar Artículo');
    }
});

// Delegación de eventos para acciones de artículo y búsqueda
articulosList.addEventListener('click', async (e) => {
    const target = e.target.closest('a');
    if (!target) return;

    e.preventDefault();
    const id = target.dataset.id;

    if (target.classList.contains('edit-articulo-btn')) {
        const doc = await db.collection('articulos').doc(id).get();
        if (doc.exists) {
            const articulo = doc.data();
            articuloForm.dataset.editingId = id;
            document.getElementById('articulo-nombre').value = articulo.nombre;
            document.getElementById('articulo-categoria').value = articulo.categoria;
            document.getElementById('articulo-precio').value = articulo.precio;
            document.getElementById('articulo-stock').value = articulo.stock;
            articuloModalTitle.textContent = 'Editar Artículo';
            saveArticuloButton.querySelector('.button-text').textContent = 'Guardar Cambios';
            openModal('articulo-modal');
        }
    } else if (target.classList.contains('delete-articulo-btn')) {
        // Implementar confirmación antes de borrar
        showConfirmationModal('¿Seguro que quieres eliminar este artículo?', async () => {
            try {
                await db.collection('articulos').doc(id).delete();
                showToast('Artículo eliminado correctamente.');
            } catch (error) {
                console.error("Error eliminando artículo: ", error);
                showToast(`Error: ${error.message}`, true);
            }
        });
    }
});

searchArticuloInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    document.querySelectorAll('.articulo-card').forEach(card => {
        const nombre = card.dataset.nombre;
        if (nombre.includes(searchTerm)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
});


// ------------------------------------------------------------------
// Modal de Confirmación Genérico
// ------------------------------------------------------------------
const confirmationModalTitle = document.getElementById('confirmation-modal-title');
const confirmationModalMessage = document.getElementById('confirmation-modal-message');
const confirmActionButton = document.getElementById('confirm-action-button');

const showConfirmationModal = (message, onConfirm, title = 'Confirmar Acción') => {
    confirmationModalTitle.textContent = title;
    confirmationModalMessage.textContent = message;

    // Clonar y reemplazar el botón para eliminar listeners antiguos
    const newConfirmButton = confirmActionButton.cloneNode(true);
    confirmActionButton.parentNode.replaceChild(newConfirmButton, confirmActionButton);

    newConfirmButton.addEventListener('click', () => {
        onConfirm();
        closeModal('confirmation-modal');
    });

    openModal('confirmation-modal');
};


// ------------------------------------------------------------------
// Módulo TPV (Punto de Dispensa)
// ------------------------------------------------------------------
const tpvSocioSelect = document.getElementById('tpv-socio');
const tpvArticuloSelect = document.getElementById('tpv-articulo');
const tpvForm = document.getElementById('tpv-form');
const realizarDispensaButton = document.getElementById('realizar-dispensa-button');
const resumenPrecioUnitario = document.getElementById('resumen-precio-unitario');
const resumenCantidad = document.getElementById('resumen-cantidad');
const resumenTotal = document.getElementById('resumen-total');
const tpvCantidadInput = document.getElementById('tpv-cantidad');

// Cargar socios y artículos en los selects del TPV
const populateTpvSelects = () => {
    // Socios
    db.collection('socios').where('status', '==', 'Verde').orderBy('nombre').onSnapshot(snapshot => {
        let options = '<option value="">Selecciona un socio...</option>';
        snapshot.forEach(doc => {
            const socio = doc.data();
            options += `<option value="${doc.id}">${socio.nombre}</option>`;
        });
        tpvSocioSelect.innerHTML = options;
    });

    // Artículos
    db.collection('articulos').where('stock', '>', 0).orderBy('nombre').onSnapshot(snapshot => {
        let options = '<option value="">Selecciona un artículo...</option>';
        snapshot.forEach(doc => {
            const articulo = doc.data();
            options += `<option value="${doc.id}" data-precio="${articulo.precio}">${articulo.nombre} (${articulo.stock} u.)</option>`;
        });
        tpvArticuloSelect.innerHTML = options;
    });
};

// Actualizar el resumen del TPV
const actualizarResumenTPV = () => {
    const selectedArticuloOption = tpvArticuloSelect.options[tpvArticuloSelect.selectedIndex];
    const precio = parseFloat(selectedArticuloOption.dataset.precio || 0);
    const cantidad = parseFloat(tpvCantidadInput.value || 0);
    const total = precio * cantidad;

    resumenPrecioUnitario.textContent = `${precio.toFixed(2)} €`;
    resumenCantidad.textContent = cantidad;
    resumenTotal.textContent = `${total.toFixed(2)} €`;

    // Habilitar botón si el formulario es válido
    const socioId = tpvSocioSelect.value;
    const articuloId = tpvArticuloSelect.value;
    if (socioId && articuloId && cantidad > 0 && total > 0) {
        realizarDispensaButton.disabled = false;
        realizarDispensaButton.classList.add('animate-pulse-emerald'); // Animación para invitar al clic
    } else {
        realizarDispensaButton.disabled = true;
        realizarDispensaButton.classList.remove('animate-pulse-emerald');
    }
};

// Listeners para el TPV
tpvForm.addEventListener('input', actualizarResumenTPV);

// Lógica para realizar la dispensa
realizarDispensaButton.addEventListener('click', async () => {
    const socioId = tpvSocioSelect.value;
    const articuloId = tpvArticuloSelect.value;
    const cantidad = Number(tpvCantidadInput.value);
    const metodoPago = document.getElementById('tpv-metodo-pago').value;

    const articuloRef = db.collection('articulos').doc(articuloId);
    const socioRef = db.collection('socios').doc(socioId);

    setButtonLoading(realizarDispensaButton, true, 'Procesando...');

    try {
        await db.runTransaction(async (transaction) => {
            const articuloDoc = await transaction.get(articuloRef);
            if (!articuloDoc.exists) {
                throw "El artículo no existe.";
            }

            const articuloData = articuloDoc.data();
            if (articuloData.stock < cantidad) {
                throw "Stock insuficiente.";
            }

            // Actualizar stock del artículo
            transaction.update(articuloRef, {
                stock: firebase.firestore.FieldValue.increment(-cantidad)
            });

            // Registrar en historial
            const historialRef = db.collection('historial').doc();
            transaction.set(historialRef, {
                tipo: 'DISPENSA',
                socioId,
                socioNombre: tpvSocioSelect.options[tpvSocioSelect.selectedIndex].text,
                articuloId,
                articuloNombre: tpvArticuloSelect.options[tpvArticuloSelect.selectedIndex].text.split(' (')[0],
                cantidad,
                total: articuloData.precio * cantidad,
                metodoPago,
                fecha: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        showToast('Dispensa realizada correctamente.');
        tpvForm.reset();
        actualizarResumenTPV();

    } catch (error) {
        console.error("Error en la transacción de dispensa: ", error);
        showToast(error.toString(), true);
    } finally {
        setButtonLoading(realizarDispensaButton, false, 'Realizar Dispensa');
    }
});

// Inicializar TPV cuando se muestra la vista
const tpvObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        if (mutation.attributeName === 'class' && mutation.target.classList.contains('active')) {
            populateTpvSelects();
            actualizarResumenTPV();
        }
    });
});
tpvObserver.observe(document.getElementById('tpv-section'), { attributes: true });


// ------------------------------------------------------------------
// Módulo de Historial
// ------------------------------------------------------------------
const historialList = document.getElementById('historial-list');

const renderHistorial = (eventos) => {
    if (eventos.length === 0) {
        historialList.innerHTML = '<p class="text-slate-400 text-center py-8">No hay actividad reciente.</p>';
        return;
    }

    historialList.innerHTML = eventos.map(evento => {
        const { tipo, fecha, socioNombre, articuloNombre, cantidad, total } = evento;
        const fechaFormateada = formatFirebaseTimestamp(fecha);
        let icon = '';
        let message = '';

        switch (tipo) {
            case 'DISPENSA':
                icon = '💸';
                message = `<strong>${socioNombre}</strong> retiró <strong>${cantidad} u.</strong> de <strong>${articuloNombre}</strong> por <strong>${total.toFixed(2)}€</strong>.`;
                break;
            case 'RECARGA':
                icon = '💰';
                message = `Se recargaron <strong>${evento.monto.toFixed(2)}€</strong> a <strong>${socioNombre}</strong>.`;
                break;
            // Añadir más tipos de eventos si es necesario
        }

        return `
            <div class="flex items-start space-x-4 p-3 bg-slate-800 rounded-lg">
                <div class="text-2xl">${icon}</div>
                <div>
                    <p class="text-slate-200">${message}</p>
                    <p class="text-xs text-slate-400">${fechaFormateada}</p>
                </div>
            </div>
        `;
    }).join('');
};

// Cargar historial
let unsubHistorial;
auth.onAuthStateChanged(user => {
    if (user) {
        unsubHistorial = db.collection('historial').orderBy('fecha', 'desc').limit(50).onSnapshot(snapshot => {
            const eventos = snapshot.docs.map(doc => doc.data());
            renderHistorial(eventos);
        });
    } else {
        if(unsubHistorial) unsubHistorial();
    }
});

console.log("App inicializada.");