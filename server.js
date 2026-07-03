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
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Yoru Box ⚡</title>

<style>
*{
    margin:0;
    padding:0;
    box-sizing:border-box;
}

body{
    background:#09090b;
    color:#fff;
    font-family:Arial,sans-serif;
    min-height:100vh;
    display:flex;
    justify-content:center;
    align-items:center;
    padding:20px;
}

.box{
    width:100%;
    max-width:360px;
    background:#18181b;
    border:1px solid #3f3f46;
    border-radius:16px;
    padding:25px;
    text-align:center;
}

h1{
    margin-bottom:20px;
}

input[type=file]{
    width:100%;
    margin-bottom:15px;
    color:#fff;
}

.btn{
    width:100%;
    padding:12px;
    border:none;
    border-radius:10px;
    background:#facc15;
    color:#000;
    font-size:16px;
    font-weight:bold;
    cursor:pointer;
}

.btn:active{
    transform:scale(.98);
}

#res{
    margin-top:20px;
}

#url{
    width:100%;
    margin-top:10px;
    padding:10px;
    border:none;
    border-radius:8px;
    background:#27272a;
    color:#fff;
    text-align:center;
}

#open{
    color:#60a5fa;
    display:block;
    margin-top:10px;
    text-decoration:none;
    word-break:break-all;
}
</style>
</head>

<body>

<div class="box">
    <h1>Yoru Box ⚡</h1>

    <input type="file" id="f" accept="image/*">

    <button class="btn" onclick="upload()">SUBIR</button>

    <div id="res"></div>
</div>

<script>
async function upload() {

    const file = document.getElementById("f").files[0];

    if (!file) {
        alert("Selecciona una imagen.");
        return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {

        document.getElementById("res").innerHTML = "Subiendo...";

        const res = await fetch("/upload", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                data: e.target.result,
                name: file.name
            })
        });

        const json = await res.json();

        document.getElementById("res").innerHTML = \`
            <p>✅ Imagen subida</p>

            <input id="url" readonly value="\${json.url}">

            <button class="btn" style="margin-top:10px;"
            onclick="navigator.clipboard.writeText(document.getElementById('url').value)">
                📋 Copiar enlace
            </button>

            <a id="open" href="\${json.url}" target="_blank">
                Abrir imagen
            </a>
        \`;
    };

    reader.readAsDataURL(file);
}
</script>

</body>
</html>`);
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
