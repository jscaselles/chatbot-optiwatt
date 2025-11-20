// API KEY (tu clave)
const API_KEY = "AIzaSyDECUvVhd4L2knTB6OP6K8bigOTdR370Gw";

// MODELO REAL DISPONIBLE SEGÚN TU CUENTA
const MODEL = "models/gemini-2.5-flash";

const SYSTEM_PROMPT = `ESTILO DE RESPUESTA:
- Usa emojis al inicio y en el desarrollo.
- Resalta ideas usando MAYÚSCULAS, guiones, símbolos como ➤, ★, ✦.
- NO uses asteriscos, almohadillas, ni caracteres de formato como *, #, _, ~ o similares.
- NO utilices negrillas, markdown ni ningún tipo de formato especial.
- Mantén un tono dinámico y fácil de leer.
- Cuando respondas listas, hazlas visualmente atractivas con emojis y separadores.
- Si el usuario pide mostrar código, muéstralo únicamente como texto plano sin marcas de formato.
- Debes ser conciso: máximo 6 frases o viñetas breves y evita saturar con datos innecesarios.
- Prioriza recomendaciones accionables y claras resumiendo ideas extensas.

Confirma que entendiste estas reglas y síguelas SIEMPRE.

eres capaz de reducir consumo energético en su salón de clases, incluyendo iluminación, ventilación, temperatura y uso de equipos.

Eres OptiWatt Assistant, el chatbot oficial de la plataforma OptiWatt.
Eres experto en eficiencia energética en salones de clase.
Tu misión es explicar, educar y recomendar maneras seguras de reducir consumo energético, iluminación, ventilación, temperatura y uso de equipos.
Debes comunicarte con tono ambiental, amable y fácil de entender.
No das consejos que impliquen riesgos eléctricos o manipulación interna de instalaciones.


`;

const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const typingIndicator = document.getElementById('typingIndicator');
const faqSection = document.getElementById('faqSection');
const WARNING_MESSAGE = "OptiWatt puede cometer errores. Verifica siempre la información importante antes de aplicarla.";
let greetingCounter = 0;

window.OptiWattConfig = {
  ...(window.OptiWattConfig || {}),
  apiKey: API_KEY,
  model: MODEL,
  systemPrompt: SYSTEM_PROMPT
};

function removeWelcome() {
  if (!chatContainer) return;
  const welcome = chatContainer.querySelector('.welcome-message');
  if (welcome) welcome.remove();
}

function hideFAQ() {
  if (!faqSection) return;
  faqSection.classList.add('hidden');
}

function showTyping() {
  if (!typingIndicator || !chatContainer) return;
  typingIndicator.style.display = 'flex';
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function hideTyping() {
  if (!typingIndicator) return;
  typingIndicator.style.display = 'none';
}

function addUserMessage(text) {
  if (!chatContainer) return;
  removeWelcome();
  hideFAQ();
  const div = document.createElement('div');
  div.className = 'message user';
  div.innerHTML = `<div class="message-bubble"><p>${text}</p></div>`;
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function sanitizeBotGreeting(text = "") {
  const normalized = text.replace(/\r/g, '');
  if (greetingCounter === 0) {
    greetingCounter += 1;
    return normalized;
  }

  const lines = normalized.split('\n');
  const filtered = [];
  let greetingRemoved = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const isGreeting = trimmed && /^[¡!¿?]*\s*(hola|buenas|saludos|hey|qué tal)/i.test(trimmed);
    if (!greetingRemoved && isGreeting) {
      greetingRemoved = true;
      continue;
    }
    filtered.push(line);
  }

  const candidate = filtered.join('\n').trim();
  greetingCounter += 1;
  return candidate.length ? filtered.join('\n').replace(/^\s+/, '') : normalized;
}

function createWarningElement() {
  const warning = document.createElement('div');
  warning.className = 'optiwatt-warning';
  warning.textContent = WARNING_MESSAGE;
  return warning;
}

function typewriterEffect(target, text, speed = 10) {
  return new Promise(resolve => {
    if (!text) {
      resolve();
      return;
    }
    let index = 0;
    const characters = Array.from(text);

    function typeNext() {
      if (index >= characters.length) {
        resolve();
        return;
      }
      const char = characters[index];
      if (char === '\n') {
        target.appendChild(document.createElement('br'));
      } else {
        target.append(char);
      }
      index += 1;
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
      setTimeout(typeNext, speed);
    }

    typeNext();
  });
}

async function addBotMessage(text) {
  if (!chatContainer) return;
  removeWelcome();
  hideFAQ();
  const div = document.createElement('div');
  div.className = 'message bot';
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  const content = document.createElement('div');
  content.className = 'message-text';
  bubble.appendChild(content);
  div.appendChild(bubble);
  chatContainer.appendChild(div);
  const sanitized = sanitizeBotGreeting(text);
  await typewriterEffect(content, sanitized);
  bubble.appendChild(createWarningElement());
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage(userMessage) {

  addUserMessage(userMessage);
  userInput.value = '';
  userInput.disabled = true;
  sendButton.disabled = true;
  showTyping();

  const prompt = `${SYSTEM_PROMPT}\n\nUsuario: ${userMessage}`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
  };

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (data.error) {
      hideTyping();
      await addBotMessage("❌ Error: " + data.error.message);
    } else {
      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No se recibió respuesta";
      hideTyping();
      await addBotMessage(botText);
    }

  } catch (err) {
    hideTyping();
    await addBotMessage("❌ Error de conexión: " + err.message);
  }

  userInput.disabled = false;
  sendButton.disabled = false;
  userInput.focus();
}

sendButton.addEventListener('click', () => {
  const msg = userInput.value.trim();
  if (msg) sendMessage(msg);
});

userInput.addEventListener('keypress', (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const msg = userInput.value.trim();
    if (msg) sendMessage(msg);
  }
});

// Event listeners para botones FAQ
document.querySelectorAll('.faq-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const question = btn.getAttribute('data-question');
    if (question) {
      sendMessage(question);
    }
  });
});

