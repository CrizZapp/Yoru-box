import express from 'express';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de tu chat
const firebaseConfig = {
  apiKey: "AIzaSyABaTv7yjGsgIu2A6mj6arml2IHGljt_H4",
  databaseURL: "https://ingresa-dfec2-default-rtdb.firebaseio.com",
  projectId: "ingresa-dfec2"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

app.use(express.json({ limit: '20mb' }));

// 1. Interfaz de subida (Zenitsu Theme)
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Yoru Box ⚡</title>
<style>
  body { background: #09090b; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; }
  .box { background: #18181b; padding: 30px; border-radius: 12px; border: 1px solid #3f3f46; text-align: center; width: 300px; }
  .btn { background: #facc15; color: #000; border: none; padding: 10px; width: 100%; cursor: pointer; font-weight: bold; margin-top: 10px; }
</style></head>
<body>
<div class="box">
  <h1>Yoru Box ⚡</h1>
  <input type="file" id="f" accept="image/*">
  <button class="btn" onclick="upload()">SUBIR</button>
  <p id="res"></p>
</div>
<script>
  async function upload() {
    const file = document.getElementById('f').files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const res = await fetch('/upload', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ data: e.target.result, name: file.name })
      });
      const json = await res.json();
      document.getElementById('res').innerText = json.url;
    };
    reader.readAsDataURL(file);
  }
</script>
</body></html>`);
});

// 2. Lógica de subida (Guarda en Realtime DB)
app.post('/upload', async (req, res) => {
    const { data, name } = req.body;
    const id = Date.now().toString();
    await set(ref(db, 'files/' + id), { data, name });
    res.json({ url: `${process.env.RENDER_EXTERNAL_URL || 'http://localhost:'+PORT}/${id}` });
});

// 3. El visor (Convierte base64 a imagen real para el bot)
app.get('/:id', async (req, res) => {
    const snapshot = await get(ref(db, 'files/' + req.params.id));
    if (!snapshot.exists()) return res.status(404).send('No existe');
    
    const { data } = snapshot.val();
    const base64Data = data.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    res.setHeader('Content-Type', 'image/png'); // O detecta el mimeType
    res.send(buffer);
});

app.listen(PORT);
