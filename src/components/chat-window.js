import { LitElement, html, css } from 'lit';
import './message-item.js';
import './chat-input.js';
import './chat-welcome.js';
import { chatStore } from '../stores/chatStore.js';
import { autorun } from 'mobx';

class ChatWindow extends LitElement {
  static properties = {
    messages: { type: Array },
  };

  constructor() {
    super();
    this.messages = chatStore.messages;
	    // Inicia la reactividad con MobX
	    this.disposeAutorun = autorun(() => {
	    // Actualiza el estado local cuando el estado de MobX cambia
         this.messages = chatStore.messages;
	      this.requestUpdate();
	    });
  }
	 
    // Limpia cuando el componente se desconecta para mejor gestión de la memoria
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.disposeAutorun) {
            this.disposeAutorun();
        }
	}



static styles = css`
:host {
  display: block;
  height: 100%;
}
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.messages-list {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center; // Centra el contenido verticalmente
  align-items: center; // Centra el contenido horizontalmente
  overflow-y: auto; // Permite desplazamiento vertical si es necesario
}
.welcome-message {
  text-align: center; // Centra el texto horizontalmente
}
.chat-input {
  width: 100%; // Asegura que el chat-input ocupe todo el ancho
}
`;

render() {
  return html`
  <link rel="stylesheet" href="./src/styles/bulmaStyles.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
  <div class="columns is-mobile is-multiline is-fullheight chat-window">
    <div class="messages-list">
      ${this.messages.length > 0
        ? this.messages.map(message => html`<message-item .message=${message}></message-item>`)
        : html`<div class="welcome-message"><chat-welcome></chat-welcome></div>`}
    </div>
  </div>
    <chat-input class="column is-12"></chat-input> <!-- Asegura que el input ocupe toda la columna -->
  `;
}

  
  
  _handleNewMessage(e) {
  }


  convertPlainTextToHTML(text) {
    // Escapar texto para evitar inyección de HTML
    const escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Convertir saltos de línea a <br>
    return escapedText.replace(/\n/g, '<br>');
  }
    /*
    const newMessage = {
      text: e.detail.text,
      user: "user", // Asumimos un usuario estático, puedes ajustar según sea necesario
      icon: "fas fa-user" // Clase de FontAwesome para el ícono del usuario
    };
    this.messages = [...this.messages, newMessage];
    this.requestUpdate(); // Solicitar actualización para asegurar que la vista se actualiza
  }
  */
}

customElements.define('chat-window', ChatWindow);

