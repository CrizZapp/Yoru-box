import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyABaTv7yjGsgIu2A6mj6arml2IHGljt_H4",
  authDomain: "ingresa-dfec2.firebaseapp.com",
  projectId: "ingresa-dfec2",
  storageBucket: "ingresa-dfec2.appspot.com",
  messagingSenderId: "441882283200",
  appId: "1:441882283200:web:8067df85facc2d67d77125"
};

const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

// Multer en MODO MEMORIA: El archivo va a la RAM, no al disco volátil de Render
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 } // Límite de 20MB para no ahogar la RAM de Render gratis
});

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// 1. ENDPOINT PARA SUBIR
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No hay archivo.' });

    try {
        const cleanName = req.file.originalname.replace(/\s+/g, '-').toLowerCase();
        const uniqueName = `${Date.now()}-${cleanName}`;
        
        // Subir a Firebase Storage
        const storageRef = ref(storage, `uploads/${uniqueName}`);
        await uploadBytes(storageRef, req.file.buffer, {
            contentType: req.file.mimetype
        });

        // Devolvemos el enlace con tu dominio de Render
        res.json({ url: `${DOMAIN}/${uniqueName}` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error subiendo a Firebase' });
    }
});

// 2. ENDPOINT MAGICO: El bot entra a la URL limpia y esto lo manda al archivo crudo
app.get('/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        
        // Buscamos el link crudo de Firebase
        const storageRef = ref(storage, `uploads/${filename}`);
        const url = await getDownloadURL(storageRef);
        
        // Redirección HTTP 302 directa a los bytes.
        // Baileys y cualquier bot lo procesan como un archivo normal sin errores.
        res.redirect(url);
    } catch (error) {
        res.status(404).send('Archivo no encontrado en Yoru Box 🌙');
    }
});

app.listen(PORT, () => console.log(`Yoru Box vivo y coleando en: ${DOMAIN}`));
