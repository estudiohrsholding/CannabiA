// RUTA DEL ARCHIVO: functions/index.js (REEMPLAZAR TODO EL CONTENIDO)

const functions = require("firebase-functions");
const cors = require("cors")({origin: true});

const cannibiaConfig = functions.config().cannibia;

/**
 * Endpoint HTTP para servir la configuración de cliente de Firebase.
 * Mapeado por firebase.json a la ruta /firebase-config.json
 */
exports.getFirebaseConfig = functions.https.onRequest((request, response) => {
  // Envuelve la lógica en CORS para manejar las solicitudes
  return cors(request, response, () => {
    // Línea dividida para no exceder los 80 caracteres
    const cacheControl = "public, max-age=3600, s-maxage=86400";
    response.set("Cache-Control", cacheControl);

    // Construir el objeto de configuración con los secretos
    const firebaseConfig = {
      apiKey: cannibiaConfig.apikey,
      authDomain: cannibiaConfig.authdomain,
      projectId: cannibiaConfig.projectid,
      storageBucket: cannibiaConfig.storagebucket,
      messagingSenderId: cannibiaConfig.messagingsenderid,
      appId: cannibiaConfig.appid,
      measurementId: cannibiaConfig.measurementid,
    };

    // Devolver la configuración como JSON
    response.status(200).json(firebaseConfig);
  });
});
