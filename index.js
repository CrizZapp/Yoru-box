import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const app = express();
const PORT = process.env.PORT || 3000;

// URL de Render automática o Localhost
const DOMAIN = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

// ==========================================
// CONFIGURACIÓN DE FIREBASE
// ==========================================
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

// ==========================================
// CONFIGURACIÓN DE MULTER (RAM STORAGE)
// ==========================================
// Guarda el archivo en memoria (RAM) para mandarlo directo a Firebase
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 } // Límite de 20MB
});

app.use(cors());

// ==========================================
// INTERFAZ DE INICIO (Diseño Yoru Box)
// ==========================================
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Yoru Box 🌙</title>
<style>
  :root { --bg: #0b0f19; --card: #151b2b; --primary: #6366f1; --primary-hover: #4f46e5; --text: #e2e8f0; --border: #2d3748; }
  body { margin: 0; font-family: sans-serif; background-color: var(--bg); color: var(--text); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
  .container { background: var(--card); padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid var(--border); text-align: center; width: 90%; max-width: 400px; }
  h1 { margin-top: 0; color: #a5b4fc; font-size: 28px; }
  p { color: #94a3b8; font-size: 14px; margin-bottom: 25px; }
  .upload-area { border: 2px dashed var(--border); border-radius: 15px; padding: 30px; cursor: pointer; transition: 0.3s; margin-bottom: 20px; display: block; }
  .upload-area:hover { border-color: var(--primary); background: rgba(99, 102, 241, 0.05); }
  input[type="file"] { display: none; }
  .btn { background: var(--primary); color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; cursor: pointer; transition: 0.3s; width: 100%; font-size: 16px; }
  .btn:hover { background: var(--primary-hover); }
  .btn:disabled { background: #475569; cursor: not-allowed; }
  #result { margin-top: 20px; display: none; text-align: left; }
  .link-box { background: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid var(--border); word-break: break-all; font-size: 13px; color: #38bdf8; margin-bottom: 10px; }
  .copy-btn { background: #10b981; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; }
</style>
</head>
<body>

<div class="container">
  <h1>Yoru Box 🌙</h1>
  <p>Links inmortales y directos para bots.</p>

  <label class="upload-area">
    <div style="font-size: 40px; margin-bottom: 10px;">📤</div>
    <span id="file-name">Selecciona un archivo</span>
    <input type="file" id="file-input">
  </label>

  <button class="btn" id="upload-btn" disabled>Subir a la nube</button>

  <div id="result">
    <div style="color: #94a3b8; font-size: 12px; margin-bottom: 5px;">Tu enlace limpio:</div>
    <div class="link-box" id="url-output"></div>
    <button class="copy-btn" id="copy-btn">Copiar Enlace</button>
  </div>
</div>

<script>
  const fileInput = document.getElementById('file-input');
  const fileNameDisplay = document.getElementById('file-name');
  const uploadBtn = document.getElementById('upload-btn');
  const resultDiv = document.getElementById('result');
  const urlOutput = document.getElementById('url-output');
  const copyBtn = document.getElementById('copy-btn');

  let selectedFile = null;

  fileInput.addEventListener('change', (e) => {
    selectedFile = e.target.files[0];
    if (selectedFile) {
      fileNameDisplay.innerText = selectedFile.name;
      uploadBtn.disabled = false;
      uploadBtn.innerText = "Subir a la nube";
      uploadBtn.style.background = "#6366f1";
      resultDiv.style.display = "none";
    }
  });

  uploadBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    uploadBtn.disabled = true;
    uploadBtn.innerText = "Subiendo... paciencia";

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/upload', { method: 'POST', body: formData });
      const data = await response.json();

      if (response.ok) {
        uploadBtn.innerText = "¡Listo!";
        uploadBtn.style.background = "#10b981";
        urlOutput.innerText = data.url;
        resultDiv.style.display = "block";
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      uploadBtn.innerText = "Falló al subir";
      uploadBtn.style.background = "#ef4444";
    }
  });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(urlOutput.innerText).then(() => {
      const originalText = copyBtn.innerText;
      copyBtn.innerText = "¡Copiado!";
      setTimeout(() => copyBtn.innerText = originalText, 2000);
    });
  });
</script>
</body>
</html>`);
});

// ==========================================
// ENDPOINT PARA PROCESAR LA SUBIDA
// ==========================================
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No enviaste archivo.' });

    try {
        const cleanName = req.file.originalname.replace(/\s+/g, '-').toLowerCase();
        const uniqueName = `${Date.now()}-${cleanName}`;
        
        // Subir buffer a Firebase
        const storageRef = ref(storage, `uploads/${uniqueName}`);
        await uploadBytes(storageRef, req.file.buffer, {
            contentType: req.file.mimetype
        });

        // Retorna el enlace bonito (ej: yoru-box.onrender.com/170000-foto.png)
        res.json({ url: `${DOMAIN}/${uniqueName}` });

    } catch (error) {
        console.error("[API ERROR]", error);
        res.status(500).json({ error: 'Error subiendo a Firebase' });
    }
});

// ==========================================
// ENDPOINT MÁGICO (Visor directo para bots)
// ==========================================
app.get('/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        
        // Saca la URL raw de Firebase
        const storageRef = ref(storage, `uploads/${filename}`);
        const url = await getDownloadURL(storageRef);
        
        // Redirige sin HTML, va directo a la carne del archivo
        res.redirect(url);
    } catch (error) {
        res.status(404).send('Archivo no encontrado o expirado.');
    }
});

app.listen(PORT, () => {
    console.log(`[SYSTEM] Yoru Box activo en puerto ${PORT}`);
});
