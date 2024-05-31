import { LitElement, html, css } from 'lit';
import './components/chat-window.js';
import { autorun } from 'mobx';
import { chatStore } from './stores/chatStore.js';

class ChatoUi extends LitElement {
  static get properties() {
    return {
      configuration: { type: String },
      endpoint: { type: String },
    };
  }

  constructor() {
    super();
    //this.configuration = JSON.stringify({ user: 'Lucas', icon: 'fa fa-gear', chat: { icon: 'fa fa-gear' } });
    this.configuration = JSON.stringify({});
    //this.endpoint = 'http://localhost:3003/api/config/6ba19572-394d-4f5c-9cfa-c138778643cf';
    this.endpoint = window.chachachatEndpoint;
    this.applyConfiguration(this.configuration);
    this.disposeAutorun = autorun(() => {
      this.applyConfiguration(this.configuration);
    });
  }

  set configuration(config) {
    const oldVal = this._configuration;
    this._configuration = config;
    this.requestUpdate('configuration', oldVal);
    this.applyConfiguration(config);
  }

  get configuration() {
    return this._configuration;
  }

  applyConfiguration(config) {
    try {
      const configObject = JSON.parse(config);
      chatStore.setConfig(configObject);
    } catch (e) {
      console.error("Failed to parse configuration:", e);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.disposeAutorun) {
      this.disposeAutorun();
    }
  }

  fetchConfig() {
    fetch(this.endpoint)
      .then(response => response.json())
      .then(data => {
        console.log("Obtenemos la configuración");
        console.log(data);
        this.configuration = JSON.stringify(data.configuration);
      })
      .catch(error => {
        console.error('Error al cargar la configuración, usamos la configuración por defecto:', error);
      });
  }

  connectedCallback() {
    super.connectedCallback();
    if (window.chachachatEndpoint) {
      this.endpoint = window.chachachatEndpoint;
      this.fetchConfig();
    } else {
      console.error('chachachatEndpoint not found');
    }
  }


  static styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box; /* Asegura que padding y border estén incluidos en la altura/anchura */
    }
    .columns {
      height: 100%;
    }
  `;

 render() {
  return html`
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <div class="container is-flex is-justify-content-center" style="height: 100%;">
      <chat-window class="column is-9"></chat-window>
    </div>
  `;
} 
}

customElements.define('chato-ui', ChatoUi);
