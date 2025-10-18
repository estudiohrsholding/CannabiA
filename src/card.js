import { db } from './firebase-init.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {

    const loadingSpinner = document.getElementById('loading-spinner');
    const dataContainer = document.getElementById('data-container');
    const errorContainer = document.getElementById('error-container');

    // Helper function to format Firestore Timestamps
    const formatFirebaseTimestamp = (timestamp) => {
        if (!timestamp || !timestamp.toDate) {
            return 'N/A';
        }
        const date = timestamp.toDate();
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Get member ID from URL
    const getMemberIdFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    };

    const memberId = getMemberIdFromUrl();

    if (!memberId) {
        loadingSpinner.classList.add('hidden');
        errorContainer.classList.remove('hidden');
        console.error("No member ID provided in the URL.");
        return;
    }

    try {
        const docRef = doc(db, "socios", memberId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const memberData = docSnap.data();

            // Populate the card with data
            document.getElementById('member-photo').src = memberData.url_foto_id || 'https://via.placeholder.com/150';
            document.getElementById('member-name').textContent = `${memberData.nombre} ${memberData.apellido}`;
            document.getElementById('member-id').textContent = docSnap.id;

            const expiryDate = memberData.fecha_caducidad_pago ? memberData.fecha_caducidad_pago.toDate() : null;
            const statusBadge = document.getElementById('status-badge');

            if (expiryDate && expiryDate > new Date()) {
                statusBadge.textContent = 'Socio Activo';
                statusBadge.classList.add('bg-green-100', 'text-green-800');
            } else {
                statusBadge.textContent = 'Socio Caducado';
                statusBadge.classList.add('bg-red-100', 'text-red-800');
            }

            document.getElementById('member-expiry').textContent = formatFirebaseTimestamp(memberData.fecha_caducidad_pago);

            // Show data and hide spinner
            dataContainer.classList.remove('hidden');
            loadingSpinner.classList.add('hidden');
        } else {
            // Handle case where member is not found
            console.error("No such document!");
            loadingSpinner.classList.add('hidden');
            errorContainer.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Error getting document:", error);
        loadingSpinner.classList.add('hidden');
        errorContainer.classList.remove('hidden');
        errorContainer.querySelector('p').textContent = `Error al cargar los datos: ${error.message}`;
    }
});