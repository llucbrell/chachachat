import { LitElement, html, css } from 'lit';
import { chatStore } from '../stores/chatStore';
import { autorun } from 'mobx';
import './buttons-prompt';


class ChatWelcome extends LitElement {
  static styles =  css`
  `;

  constructor() {
    super();
    this.chatStore = chatStore;
    this.disposeAutorun = autorun(() => {
        // Asegúrate de que esto se esté ejecutando cuando cambia el mensaje de bienvenida
        // OJO NO QUITES EL CONSOLE LOG ACTIVA LA REACTIVIDAD DEL WELCOME, PARECE UN BUG
        console.log("Nuevo Chat configurado\n Bienvenida:\n\t", chatStore.welcome);
        // OJO NO QUITES EL CONSOLE LOG ACTIVA LA REACTIVIDAD DEL WELCOME, PARECE UN BUG
        this.chatStore = chatStore;
        this.requestUpdate();
    });
}


	 
    // Limpia cuando el componente se desconecta para mejor gestión de la memoria
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.disposeAutorun) {
            this.disposeAutorun();
            this.requestUpdate();
        }
	}


     render() {
    return html`
      <div class="chat-welcome">
      ${this.chatStore.welcome? html`
      <h2>
        ${this.chatStore.welcome}
      </h2>
      <div>
      <buttons-prompt></buttons-prompt>
      </div>
        ` : html`''`
      }
      </div>
    `;
  }

}

customElements.define('chat-welcome', ChatWelcome);
