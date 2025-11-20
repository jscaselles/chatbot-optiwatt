(function () {
  const widgetRoot = document.getElementById('optiwatt-widget');
  if (!widgetRoot) return;

  const defaultConfig = {
    apiKey: "AIzaSyDECUvVhd4L2knTB6OP6K8bigOTdR370Gw",
    model: "models/gemini-2.5-flash",
    systemPrompt: `ESTILO DE RESPUESTA:
- Usa emojis al inicio y en el desarrollo.
- Resalta ideas usando MAYÚSCULAS, guiones, símbolos como ➤, ★, ✦.
- NO uses asteriscos, almohadillas, ni caracteres de formato como *, #, _, ~ o similares.
- NO utilices negrillas, markdown ni ningún tipo de formato especial.
- Mantén un tono dinámico y fácil de leer.
- Cuando respondas listas, hazlas visualmente atractivas con emojis y separadores.
- Si el usuario pide mostrar código, muéstralo únicamente como texto plano sin marcas de formato.
- Tu respuesta debe ser concisa (4 a 6 frases o viñetas cortas) y sin datos redundantes.
- Resume los conceptos extensos para no saturar al usuario.

Confirma que entendiste estas reglas y síguelas SIEMPRE.

eres capaz de reducir consumo energético en su salón de clases, incluyendo iluminación, ventilación, temperatura y uso de equipos.

Eres OptiWatt Assistant, el chatbot oficial de la plataforma OptiWatt.
Eres experto en eficiencia energética en salones de clase.
Tu misión es explicar, educar y recomendar maneras seguras de reducir consumo energético, iluminación, ventilación, temperatura y uso de equipos.
Debes comunicarte con tono ambiental, amable y fácil de entender.
No das consejos que impliquen riesgos eléctricos o manipulación interna de instalaciones.
`
  };

  const { apiKey, model, systemPrompt } = {
    ...defaultConfig,
    ...(window.OptiWattConfig || {})
  };

  const WARNING_MESSAGE = "OptiWatt puede cometer errores. Verifica siempre la información importante antes de aplicarla.";

  widgetRoot.classList.add('optiwatt-widget');
  widgetRoot.innerHTML = `
    <button class="optiwatt-widget__fab" aria-label="Abrir chat OptiWatt">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 3C7.031 3 3 6.589 3 11c0 1.909.723 3.67 1.941 5.086-.086 1.212-.43 2.348-1.176 3.229a.5.5 0 0 0 .41.819c1.686-.11 3.418-.582 4.806-1.23A10.69 10.69 0 0 0 12 19c4.969 0 9-3.589 9-8s-4.031-8-9-8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="9" cy="11" r="1.2" fill="currentColor"/>
        <circle cx="12" cy="11" r="1.2" fill="currentColor"/>
        <circle cx="15" cy="11" r="1.2" fill="currentColor"/>
      </svg>
    </button>
    <div class="optiwatt-widget__window" aria-hidden="true">
      <div class="optiwatt-widget__header">
        <div>
          <span class="optiwatt-widget__title">OptiWatt</span>
          <span class="optiwatt-widget__subtitle">Asistente energético</span>
        </div>
        <button class="optiwatt-widget__close" aria-label="Cerrar chat">&times;</button>
      </div>
      <div class="optiwatt-widget__messages" role="log" aria-live="polite"></div>
      <div class="optiwatt-widget__typing" hidden>OptiWatt está escribiendo...</div>
      <div class="optiwatt-widget__input">
        <input type="text" class="optiwatt-widget__input-field" placeholder="Pregunta sobre eficiencia energética..." aria-label="Escribe tu mensaje">
        <button class="optiwatt-widget__send" type="button" aria-label="Enviar mensaje">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  const fabButton = widgetRoot.querySelector('.optiwatt-widget__fab');
  const windowEl = widgetRoot.querySelector('.optiwatt-widget__window');
  const closeButton = widgetRoot.querySelector('.optiwatt-widget__close');
  const messagesEl = widgetRoot.querySelector('.optiwatt-widget__messages');
  const typingEl = widgetRoot.querySelector('.optiwatt-widget__typing');
  const inputEl = widgetRoot.querySelector('.optiwatt-widget__input-field');
  const sendButton = widgetRoot.querySelector('.optiwatt-widget__send');

  let widgetOpen = false;
  let busy = false;
  let widgetGreetingCounter = 0;

  function toggleWindow(forceState) {
    widgetOpen = typeof forceState === 'boolean' ? forceState : !widgetOpen;
    windowEl.classList.toggle('optiwatt-widget__window--open', widgetOpen);
    widgetRoot.classList.toggle('optiwatt-widget--open', widgetOpen);
    windowEl.setAttribute('aria-hidden', String(!widgetOpen));
    if (widgetOpen) {
      inputEl.focus();
    }
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    typingEl.hidden = false;
    scrollToBottom();
  }

  function hideTyping() {
    typingEl.hidden = true;
  }

  function sanitizeGreeting(text = "") {
    const normalized = text.replace(/\r/g, '');
    if (widgetGreetingCounter === 0) {
      widgetGreetingCounter += 1;
      return normalized;
    }

    const lines = normalized.split('\n');
    const filtered = [];
    let removed = false;

    for (const line of lines) {
      const trimmed = line.trim();
      const isGreeting = trimmed && /^[¡!¿?]*\s*(hola|buenas|saludos|hey|qué tal)/i.test(trimmed);
      if (!removed && isGreeting) {
        removed = true;
        continue;
      }
      filtered.push(line);
    }

    const cleaned = filtered.join('\n').trim();
    widgetGreetingCounter += 1;
    return cleaned ? filtered.join('\n').replace(/^\s+/, '') : normalized;
  }

  function createWarningElement() {
    const warning = document.createElement('div');
    warning.className = 'optiwatt-warning optiwatt-widget__warning';
    warning.textContent = WARNING_MESSAGE;
    return warning;
  }

  function typewriter(target, text, speed = 10) {
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
        scrollToBottom();
        setTimeout(typeNext, speed);
      }

      typeNext();
    });
  }

  async function addMessage(type, text) {
    const bubble = document.createElement('div');
    bubble.className = `optiwatt-widget__bubble optiwatt-widget__bubble--${type}`;
    const content = document.createElement('div');
    bubble.appendChild(content);

    messagesEl.appendChild(bubble);
    scrollToBottom();

    if (type === 'bot') {
      const sanitized = sanitizeGreeting(text);
      await typewriter(content, sanitized);
      const warning = createWarningElement();
      bubble.appendChild(warning);
    } else {
      content.textContent = text;
    }

    scrollToBottom();
  }

  async function requestResponse(message) {
    const prompt = `${systemPrompt}\n\nUsuario: ${message}`;
    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'Error al generar respuesta');
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No se recibió respuesta";
  }

  async function handleSend() {
    const value = inputEl.value.trim();
    if (!value || busy) return;
    busy = true;
    inputEl.value = '';
    await addMessage('user', value);
    showTyping();

    try {
      const botReply = await requestResponse(value);
      hideTyping();
      await addMessage('bot', botReply);
    } catch (error) {
      hideTyping();
      await addMessage('bot', `❌ Error: ${error.message}`);
    } finally {
      busy = false;
      inputEl.focus();
    }
  }

  fabButton.addEventListener('click', () => toggleWindow());
  closeButton.addEventListener('click', () => toggleWindow(false));
  sendButton.addEventListener('click', handleSend);

  inputEl.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  });

  // Mensaje inicial corto para evitar saludos repetidos más adelante
  addMessage('bot', "🌱 Soy OptiWatt Assistant. Cuéntame qué necesitas optimizar en tu salón y buscaremos la mejor solución energética.");
})();

