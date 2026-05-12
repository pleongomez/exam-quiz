# Exam Quiz 🎓

Aplicación web de tipo quiz interactivo para practicar y preparar cualquier certificación. Permite seleccionar un banco de preguntas desde un desplegable, cargar un fichero JSON personalizado, configurar el examen y obtener un resultado detallado al finalizar.

---

## 📁 Estructura del proyecto

```
exam-quiz/
├── index.html           # Estructura HTML de la aplicación
├── app.js               # Lógica principal de la aplicación
├── style.css            # Estilos de la interfaz
├── server.js            # Servidor Node.js (estático + API)
├── questions.json       # Banco de preguntas legacy (opcional)
└── questions/           # Directorio de bancos de preguntas
    ├── gh-200-github-actions.json
    └── gh-300-github-copilot.json
```

---

## ✨ Características

- **Selector de banco de preguntas** – Desplegable que lista automáticamente todos los ficheros `.json` del directorio `questions/`. Al seleccionar uno, las preguntas se cargan de inmediato.
- **Dos modos de juego:**
  - 📝 **Exam** – Responde todas las preguntas y recibe la puntuación al final.
  - 🎓 **Practice** – Recibe feedback inmediato tras cada respuesta.
- **Preguntas de selección múltiple** – La app indica cuántas respuestas correctas hay en cada pregunta.
- **Configuración del rango de preguntas** – Define desde qué número hasta qué número quieres practicar.
- **Pick aleatorio** – Selecciona aleatoriamente *N* preguntas del rango definido.
- **Mezcla de preguntas** (*Shuffle*) – Aleatoriza el orden de las preguntas.
- **Carga de preguntas personalizada** – Arrastra y suelta o selecciona cualquier fichero `.json` compatible como alternativa al selector.
- **Título dinámico** – El encabezado muestra un título genérico en la pantalla de inicio y el nombre del examen seleccionado al iniciar el quiz.
- **Pantalla de resultados** con puntuación, número de aciertos y fallos.
- **Revisión detallada** de todas las respuestas al terminar.
- **Sin dependencias externas** – Funciona con HTML, CSS y JS vanilla.

---

## 📋 Formato del fichero de preguntas

El fichero `questions.json` (o cualquier fichero personalizado) debe seguir la siguiente estructura, con un objeto raíz que incluya el nombre del examen y el array de preguntas:

```json
{
  "exam_name": "Nombre del Examen",
  "questions": [
    {
      "question_number": 1,
      "question": "¿Texto de la pregunta?",
      "answers": [
        { "key": "A", "text": "Opción A" },
        { "key": "B", "text": "Opción B" },
        { "key": "C", "text": "Opción C" }
      ],
      "correct_answers": ["A"],
      "question_image": "https://url-opcional-de-imagen.png"
    }
  ]
}
```

> ℹ️ **Compatibilidad:** También se acepta el formato legacy donde el fichero es directamente un array de preguntas (sin objeto raíz ni `exam_name`).

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `exam_name` | string | ✅ | Nombre del examen. Se muestra en el encabezado y en el título de la página |
| `questions` | array | ✅ | Lista de preguntas del examen |
| `question_number` | number | ✅ | Identificador único de la pregunta |
| `question` | string | ✅ | Enunciado de la pregunta |
| `answers` | array | ✅ | Lista de opciones con `key` y `text` |
| `correct_answers` | array | ✅ | Array con las claves correctas (ej: `["A", "C"]`) |
| `question_image` | string | ❌ | URL de imagen opcional para la pregunta |

---

## 🚀 Cómo arrancar la aplicación

La aplicación requiere un servidor para que el selector de bancos de preguntas funcione correctamente (el servidor expone `/api/question-banks` que lee el directorio `questions/` de forma dinámica).

### Opción 1 – Servidor Node.js incluido ⭐ Recomendado

El proyecto incluye `server.js`, un servidor HTTP sin dependencias externas que sirve los ficheros estáticos y la API.

```bash
node server.js
```

La app estará disponible en `http://localhost:3000`.

**Cambiar el puerto:**

```bash
PORT=8080 node server.js
# → http://localhost:8080
```

**Mantener el proceso activo en producción con pm2:**

```bash
npm install -g pm2
pm2 start server.js --name exam-quiz
pm2 save
pm2 startup   # configura el arranque automático al reiniciar el sistema
```

**Añadir un nuevo banco de preguntas** es tan sencillo como copiar el fichero `.json` en el directorio `questions/`:

```bash
cp mi-examen.json questions/
# Al recargar la app, aparecerá automáticamente en el desplegable
```

---

### Opción 2 – Extensión Live Server (VS Code)

> ⚠️ El selector de bancos de preguntas **no funcionará** porque Live Server no ejecuta `server.js`. Las preguntas deberán cargarse con el botón de carga manual.

1. Instala la extensión [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) en VS Code.
2. Haz clic derecho sobre `index.html` → **"Open with Live Server"**.

### Opción 3 – Python (HTTP server)

> ⚠️ Misma limitación que Live Server: el selector de bancos no funcionará.

```bash
python -m http.server 8080
# → http://localhost:8080
```

### Opción 4 – Abrir directamente en el navegador

> ⚠️ **No recomendado.** Abrir el fichero con `file://` bloquea las peticiones fetch por restricciones CORS.

---

## 🌐 Despliegue en producción

### VPS / Servidor Linux

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/exam-quiz.git
cd exam-quiz

# Arrancar con pm2
npm install -g pm2
pm2 start server.js --name exam-quiz
pm2 save && pm2 startup
```

Con Nginx como reverse proxy en el puerto 80:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Netlify (hosting estático + Functions)

Netlify no ejecuta `server.js`, pero el endpoint de la API puede sustituirse por una Netlify Function. Crea los siguientes ficheros:

```
exam-quiz/
├── netlify/
│   └── functions/
│       └── question-banks.js
└── netlify.toml
```

```javascript
// netlify/functions/question-banks.js
const fs   = require('fs');
const path = require('path');

exports.handler = async () => {
  const dir = path.join(process.cwd(), 'questions');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const banks = files.map(f => ({
    label: f.replace(/\.json$/i, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    path: `questions/${f}`,
  }));
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(banks),
  };
};
```

```toml
# netlify.toml
[build]
  publish = "."
  functions = "netlify/functions"

[[redirects]]
  from = "/api/question-banks"
  to   = "/.netlify/functions/question-banks"
  status = 200
```

Deploy:

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

---

## 🎮 Cómo usar la aplicación

1. **Pantalla de inicio:** Al cargar la app, el primer banco de preguntas del directorio `questions/` se selecciona automáticamente en el desplegable.
2. **Cambiar banco de preguntas:** Selecciona otro examen en el desplegable *Question Bank*. Las preguntas se recargan al instante.
3. **Cargar preguntas personalizadas:** Como alternativa al desplegable, arrastra un fichero `.json` a la zona de carga o haz clic para seleccionarlo.
4. **Configurar el quiz:**
   - Selecciona el rango de preguntas (From / To).
   - Indica cuántas preguntas quieres en la sesión (*Pick from range*).
   - Activa *Shuffle* para aleatorizar el orden.
   - Elige el modo **Exam** o **Practice**.
5. **Iniciar:** Pulsa **Start Quiz**. El encabezado mostrará el nombre del examen seleccionado.
6. **Responder:** Selecciona tus respuestas y pulsa **Submit** al terminar.
7. **Resultados:** Consulta tu puntuación y revisa las respuestas correctas e incorrectas.

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| HTML5 | Estructura de la interfaz |
| CSS3 | Estilos y diseño responsivo |
| JavaScript (ES6+) | Lógica de la aplicación |
| Node.js (`http`, `fs`) | Servidor estático y API de bancos de preguntas |
| Fetch API | Carga del banco de preguntas y llamada a la API |
| FileReader API | Carga de ficheros JSON personalizados |

---

## 📝 Licencia

Proyecto de uso libre para estudio y preparación de certificaciones.

