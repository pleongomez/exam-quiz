# Exam Quiz 🎓

Aplicación web de tipo quiz interactivo para practicar y preparar cualquier certificación. Permite cargar preguntas desde un fichero JSON, configurar el examen y obtener un resultado detallado al finalizar.

---

## 📁 Estructura del proyecto

```
exam-quiz/
├── index.html        # Estructura HTML de la aplicación
├── app.js            # Lógica principal de la aplicación
├── style.css         # Estilos de la interfaz
└── questions.json    # Banco de preguntas por defecto
```

---

## ✨ Características

- **Dos modos de juego:**
  - 📝 **Exam** – Responde todas las preguntas y recibe la puntuación al final.
  - 🎓 **Practice** – Recibe feedback inmediato tras cada respuesta.
- **Preguntas de selección múltiple** – La app indica cuántas respuestas correctas hay en cada pregunta.
- **Configuración del rango de preguntas** – Define desde qué número hasta qué número quieres practicar.
- **Pick aleatorio** – Selecciona aleatoriamente *N* preguntas del rango definido.
- **Mezcla de preguntas** (*Shuffle*) – Aleatoriza el orden de las preguntas.
- **Carga de preguntas personalizada** – Arrastra y suelta o selecciona cualquier fichero `.json` compatible.
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

La aplicación es **puramente estática** (HTML + CSS + JS). No requiere instalación de dependencias ni servidor backend. Hay varias formas de ejecutarla:

### Opción 1 – Extensión Live Server (VS Code) ⭐ Recomendado

1. Instala la extensión [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) en VS Code.
2. Abre la carpeta `exam-quiz` en VS Code.
3. Haz clic derecho sobre `index.html` → **"Open with Live Server"**.
4. La app se abrirá automáticamente en tu navegador en `http://127.0.0.1:5500`.

### Opción 2 – Python (HTTP server)

Si tienes Python instalado, ejecuta en la terminal dentro de la carpeta del proyecto:

```bash
# Python 3
python -m http.server 8080
```

Abre el navegador en `http://localhost:8080`.

### Opción 3 – Node.js (npx serve)

Si tienes Node.js instalado:

```bash
npx serve .
```

Abre el navegador en la URL que indique la terminal (normalmente `http://localhost:3000`).

### Opción 4 – Abrir directamente en el navegador

> ⚠️ **Nota:** Abrir el fichero directamente (`file://`) puede bloquear la carga del fichero `questions.json` por restricciones CORS del navegador. Se recomienda usar alguna de las opciones anteriores.

---

## 🎮 Cómo usar la aplicación

1. **Pantalla de inicio:** Al cargar la app, las preguntas de `questions.json` se cargan automáticamente.
2. **Cargar preguntas personalizadas:** Arrastra un fichero `.json` a la zona de carga o haz clic para seleccionarlo.
3. **Configurar el quiz:**
   - Selecciona el rango de preguntas (From / To).
   - Indica cuántas preguntas quieres en la sesión (*Pick from range*).
   - Activa *Shuffle* para aleatorizar el orden.
   - Elige el modo **Exam** o **Practice**.
4. **Iniciar:** Pulsa **Start Quiz**.
5. **Responder:** Selecciona tus respuestas y pulsa **Submit** al terminar.
6. **Resultados:** Consulta tu puntuación y revisa las respuestas correctas e incorrectas.

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| HTML5 | Estructura de la interfaz |
| CSS3 | Estilos y diseño responsivo |
| JavaScript (ES6+) | Lógica de la aplicación |
| Fetch API | Carga del fichero JSON por defecto |
| FileReader API | Carga de ficheros JSON personalizados |

---

## 📝 Licencia

Proyecto de uso libre para estudio y preparación de certificaciones..

