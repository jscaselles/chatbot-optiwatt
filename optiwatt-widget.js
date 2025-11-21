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
- Tu respuesta debe ser MUY CONCISA (máximo 3-4 frases o 2-3 viñetas cortas) y sin datos redundantes.
- Resume los conceptos extensos para no saturar al usuario.
- IMPORTANTE: Al final de CADA respuesta, SIEMPRE pregunta si desea más información o si tiene otra pregunta relacionada. Usa frases como: "¿Te gustaría saber más sobre esto?" o "¿Tienes alguna otra pregunta?" o "¿Necesitas más detalles sobre algún punto específico?"

Confirma que entendiste estas reglas y síguelas SIEMPRE.

eres capaz de reducir consumo energético en su salón de clases, incluyendo iluminación, ventilación, temperatura y uso de equipos.

Eres OptiWatt Assistant, el chatbot oficial de la plataforma OptiWatt.
Eres experto en eficiencia energética en salones de clase.
Tu misión es explicar, educar y recomendar maneras seguras de reducir consumo energético, iluminación, ventilación, temperatura y uso de equipos.
Debes comunicarte con tono ambiental, amable y fácil de entender.
No das consejos que impliquen riesgos eléctricos o manipulación interna de instalaciones.
`
  };

  const FAQ_QUESTIONS = [
    "¿Cómo puedo reducir el consumo de energía en mi salón?",
    "¿Qué temperatura es ideal para un salón de clases?",
    "¿Cómo optimizar la iluminación del salón?",
    "¿Qué hacer con la ventilación para ahorrar energía?",
    "¿Cómo usar los equipos electrónicos eficientemente?"
  ];

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
        <div class="optiwatt-widget__header-actions">
          <button class="optiwatt-widget__faq-btn" aria-label="Preguntas frecuentes" title="Preguntas frecuentes">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" fill="currentColor"/>
            </svg>
          </button>
          <button class="optiwatt-widget__close" aria-label="Cerrar chat">&times;</button>
        </div>
      </div>
      <div class="optiwatt-widget__faq-panel" hidden>
        <div class="optiwatt-widget__faq-header">
          <span>Preguntas Frecuentes</span>
          <button class="optiwatt-widget__faq-close" aria-label="Cerrar FAQ">&times;</button>
        </div>
        <div class="optiwatt-widget__faq-list"></div>
      </div>
      <div class="optiwatt-widget__messages" role="log" aria-live="polite"></div>
      <div class="optiwatt-widget__typing" hidden>OptiWatt está escribiendo...</div>
      <div class="optiwatt-widget__input">
        <button class="optiwatt-widget__voice-btn" type="button" aria-label="Grabar audio" title="Grabar audio">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
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
  const faqButton = widgetRoot.querySelector('.optiwatt-widget__faq-btn');
  const faqPanel = widgetRoot.querySelector('.optiwatt-widget__faq-panel');
  const faqClose = widgetRoot.querySelector('.optiwatt-widget__faq-close');
  const faqList = widgetRoot.querySelector('.optiwatt-widget__faq-list');
  const voiceButton = widgetRoot.querySelector('.optiwatt-widget__voice-btn');

  let widgetOpen = false;
  let busy = false;
  let widgetGreetingCounter = 0;
  let isListening = false;
  let recognition = null;
  let synth = window.speechSynthesis;

  // Inicializar reconocimiento de voz
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      inputEl.value = transcript;
      voiceButton.classList.remove('optiwatt-widget__voice-btn--active');
      isListening = false;
    };

    recognition.onerror = (event) => {
      console.error('Error en reconocimiento de voz:', event.error);
      voiceButton.classList.remove('optiwatt-widget__voice-btn--active');
      isListening = false;
      if (event.error === 'not-allowed') {
        alert('Por favor, permite el acceso al micrófono para usar la función de voz.');
      }
    };

    recognition.onend = () => {
      voiceButton.classList.remove('optiwatt-widget__voice-btn--active');
      isListening = false;
    };
  } else {
    voiceButton.style.display = 'none';
  }

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

  function speakText(text) {
    if (synth && text) {
      // Detener cualquier síntesis anterior
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      synth.speak(utterance);
    }
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
      
      // Reproducir audio de la respuesta
      speakText(sanitized);
    } else {
      content.textContent = text;
    }

    scrollToBottom();
  }

  function toggleFAQ() {
    const isHidden = faqPanel.hidden;
    faqPanel.hidden = !isHidden;
    if (!isHidden) {
      messagesEl.style.display = 'flex';
    } else {
      messagesEl.style.display = 'flex';
    }
  }

  function initFAQ() {
    FAQ_QUESTIONS.forEach((question, index) => {
      const faqItem = document.createElement('button');
      faqItem.className = 'optiwatt-widget__faq-item';
      faqItem.textContent = question;
      faqItem.addEventListener('click', () => {
        inputEl.value = question;
        toggleFAQ();
        handleSend();
      });
      faqList.appendChild(faqItem);
    });
  }

  function toggleVoiceRecognition() {
    if (!recognition) {
      alert('Tu navegador no soporta reconocimiento de voz.');
      return;
    }

    if (isListening) {
      recognition.stop();
      voiceButton.classList.remove('optiwatt-widget__voice-btn--active');
      isListening = false;
    } else {
      try {
        recognition.start();
        voiceButton.classList.add('optiwatt-widget__voice-btn--active');
        isListening = true;
      } catch (error) {
        console.error('Error al iniciar reconocimiento:', error);
      }
    }
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
  faqButton.addEventListener('click', toggleFAQ);
  faqClose.addEventListener('click', toggleFAQ);
  voiceButton.addEventListener('click', toggleVoiceRecognition);

  inputEl.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  });

  // Inicializar FAQ
  initFAQ();

  // Mensaje inicial corto para evitar saludos repetidos más adelante
  addMessage('bot', "🌱 Soy OptiWatt Assistant. Cuéntame qué necesitas optimizar en tu salón y buscaremos la mejor solución energética.");
})();

