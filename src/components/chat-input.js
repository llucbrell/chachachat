import { LitElement, html, css } from 'lit';
import { chatStore } from '../stores/chatStore';
import { autorun } from 'mobx';
import OllamaService from '../services/ollamaService';
import { jsPDF } from 'jspdf';

class ChatInput extends LitElement {
  static styles = css`
    .chat-input {
      display: flex;
      padding: 1rem;
    }
    .chat-input-container {
      margin-bottom: 10%;
    }
    .input, .button {
      margin: 0.5rem;
    }
    .text-format {
      display: block; /* Asegura que el texto ocupe su propia línea */
      white-space: pre-wrap; /* Preserva espacios y saltos de línea y permite el ajuste de palabra */
      padding: 0.1rem;
      padding-top: 0rem;
      padding-bottom: 0.6rem;
    }
    .spinner {
      display: inline-block; /* Cambiado de 'none' para mostrar cuando esté activo */
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 2px solid #ccc;
      border-top-color: #333;
      margin-left: 5px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .message-buttons{
      margin-left: 3%;
      float:left;
      color: grey;
      padding-bottom: 0.1rem;
    }
    .icon-button {
      float:left;
      border: none;
      background: none;
      cursor: pointer;
      color: inherit; /* Hereda el color de su contenedor */
      padding: 0.5rem;
      display: flex; /* Asegura que el icono esté centrado en el botón */
      align-items: center;
    }
    .icon-button:hover{
      color: hsl(217, 71%, 53%);
    }
  `;

  static properties = {
    //isLoading: { type: Boolean },
    lastContext: { type: Array },
  };

  constructor() {
    super();
    //this.isLoading = false;
    this.lastContext = [];
    this.disposeAutorun = autorun(() => {
      this.chatStore = chatStore;
      this.messageContent = chatStore.messageContent;
      this.requestUpdate();
    });
    this.disposeFlagWatcher = autorun(() => {
      this.isLoading = chatStore.isOllamaCommunicationFlag;  // Asegura que isLoading se actualice
      this.messageContent = chatStore.messageContent;
      this.requestUpdate();  // Requerido para que LitElement sepa que debe re-renderizar
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.disposeAutorun) {
      this.disposeAutorun();
    }
  }

  render() {
    return html`
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    ${this.chatStore.messageContent.length > 0? html`
      <div class="text-format">
        ${this.chatStore.messageContent}
      </div>
    ` : html`` }
      <div class="chat-input-container">
      <div class="chat-input">
        <textarea class="input" placeholder="Escribe tu mensaje..." id="messageInput" @keydown="${this._checkEnter}"></textarea>
        <button ?disabled="${this.chatStore.isOllamaCommunicationFlag}" class="button is-link" @click="${this._addToChat}">
        ${this.chatStore.isOllamaCommunicationFlag ? html`Cargando<span class="spinner"></span>` : html`Enviar`}
      </button>
      </div>

    <div class="message-buttons">
    <button class="icon-button" @click="${this.downloadAsText}">
        <i class="fas fa-file-alt"></i>
      </button>
      <button class="icon-button" @click="${this.downloadAsPdf}">
        <i class="fas fa-file-pdf"></i>
      </button>
      </div>
      </div>
    `;
  }

  _checkEnter(e) {
    if (e.key === 'Enter' && !e.ctrlKey) {
      e.preventDefault();
      const textarea = this.shadowRoot.getElementById('messageInput');
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = textarea.value.substring(0, cursorPos);
      const textAfterCursor = textarea.value.substring(cursorPos);
      textarea.value = textBeforeCursor + '\n' + textAfterCursor;
      textarea.selectionStart = textarea.selectionEnd = cursorPos + 1;
    } else if (e.key === 'Enter' && e.ctrlKey  && !this.chatStore.isOllamaCommunicationFlag) {
      this._addToChat();
    }
  }

  _addToChat() {
    //console.log(this.chatStore.isOllamaCommunicationFlag)
    const input = this.shadowRoot.getElementById('messageInput');
    if (input.value.trim() !== '') {
      this.chatStore.addMessageToChatList(input.value, this.lastContext,this.chatStore.icon, this.chatStore.userColor, this.chatStore.user);
      this.askOllama(input.value);
      input.value = '';
      window.scrollTo(0, document.body.scrollHeight);
    }
  }

  async askOllama(question){
    // usamos la configuración del enpoint (manitou) para gestionar lastContext de la forma correcta
    if(this.chatStore.chat.endpoint.manitou){
      console.log("Gestionamos lastIndex con langchain");
    }else{
      this.chatStore.askOllamaApi(question);
      /*
      // await this.chatStore.askOllamaApi(question); // previo stream
        console.log("Gestionamos lastIndex de manera normal");
        this.chatStore.toggleOllamaCommunicationFlag();
        let url = this.chatStore.chat.endpoint.url;
        const ollamaService = new OllamaService(url);
        try {
          let body = this.chatStore.chat.endpoint.body;
          body.prompt = question;
          this.chatStore.chat.endpoint.beforeFirstPrompt && this.lastId == 1 ? body.prompt = this.chat.endpoint.beforeFirstPrompt + body.prompt : null;
          this.chatStore.chat.endpoint.beforeAllPrompts? body.prompt = this.chat.endpoint.beforeAllPrompts + body.prompt : null;
          this.chatStore.chat.endpoint.afterAllPrompts? body.prompt = body.prompt + this.chat.endpoint.afterAllPrompts : null;
          const data = await ollamaService.apiBypass(body, this.chatStore.lastContext);
          if(data !== undefined){
            console.log('Completion generated:', data);
            this.chatStore.addMessageToChatList(data.response, data.context, this.chatStore.chat.icon, this.chatStore.chat.color, this.chatStore.name);
            this.chatStore.lastContext = this.chatStore.lastContext.concat(data.context);
          }
        } catch (error) {
          console.error('Error:', error);
        } finally {
          this.chatStore.toggleOllamaCommunicationFlag();
        }


    */
    }
    //this.lastContext = this.lastContext.concat(data.context);
    //console.log(this.lastContext);
    console.log(this.chatStore.lastContext);
    window.scrollTo(0, document.body.scrollHeight);
  }

  /*
  async askOllama(question) {
    //this.isLoading = true;
    this.chatStore.toggleOllamaCommunicationFlag();
    let url = this.chatStore.chat.endpoint.url;
    const ollamaService = new OllamaService(url);
    try {
     // const data = await ollamaService.generateCompletion(this.chatStore.chat.endpoint.model, question, this.lastContext);
      let body = this.chatStore.chat.endpoint.body;
      body.prompt = question;
      this.chatStore.chat.endpoint.beforeAllPrompts? body.prompt = this.chatStore.chat.endpoint.beforeAllPrompts + body.prompt : null;
      this.chatStore.chat.endpoint.afterAllPrompts? body.prompt = body.prompt + this.chatStore.chat.endpoint.afterAllPrompts : null;
      const data = await ollamaService.apiBypass(body, this.lastContext);
      console.log('Completion generated:', data);
      this.chatStore.addMessageToChatList(data.response, data.context, this.chatStore.chat.icon, this.chatStore.chat.color, this.chatStore.chat.name);
      this.lastContext = this.lastContext.concat(data.context);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      //this.isLoading = false;
      this.chatStore.toggleOllamaCommunicationFlag();
      window.scrollTo(0, document.body.scrollHeight);
    }
  }
*/

prepareContentForDownload() {
  return this.chatStore.messages.map(msg => `${msg.user}: ${msg.text}`).join('\n');
}

downloadAsText() {
  const content = this.prepareContentForDownload();
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chat-messages.txt';
  a.click();
  URL.revokeObjectURL(url); // Limpia el objeto URL después de la descarga
}

downloadAsPdf() {
  const content = this.prepareContentForDownload();  // Asegura que esta función devuelve el texto a incluir en el PDF
  const doc = new jsPDF();

  // Define márgenes y dimensiones
  const marginLeft = 10;
  const marginTop = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - 2 * marginLeft; // Calcula el máximo ancho de texto permitido manteniendo márgenes en ambos lados

  // Añade el texto con ajuste automático
  doc.text(content, marginLeft, marginTop, { maxWidth: maxWidth });

  doc.save('chat-messages.pdf');
}



}



customElements.define('chat-input', ChatInput);
