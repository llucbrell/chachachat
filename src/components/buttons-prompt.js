import { LitElement, html, css } from 'lit';
import { chatStore } from '../stores/chatStore';  // Asegúrate de tener la ruta correcta
import { autorun } from 'mobx';

class ButtonsPrompt extends LitElement {
  static styles = css`
    button {
      margin: 4px;
      padding: 8px 16px;
    }
    .my-button {
      margin: 4px;
      padding: 8px 16px;
      background: #ffffff;
      box-shadow: none;
    }
    .send-container{

    }
    .editable-text {
      padding: 4px;
      margin: 4px;
      min-width: 100px;
      display: inline-block;
      white-space: pre;
      text-align:left;
    }
  `;

  constructor() {
    super();
    this.buttons = [];
    this.disposeAutorun = autorun(() => {
      this.buttons = chatStore.chat.buttons.map(button => ({
        ...button,
        prompt: chatStore.replaceVariables(button.prompt)
      }));
      this.chatStore = chatStore;
      this.requestUpdate();
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
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css">
      ${this.buttons.map((button) =>
        button.editable ? html`
          <div class="send-container">
            <div class="editable-text" contenteditable="true" @input="${(e) => this._updatePrompt(e, button)}">${button.prompt}</div>
            <button class="my-button button send" @click="${() => this._addToChat(button)}">Enviar</button>
          </div>
        ` : html`
          <button class="button" @click="${() => this._addToChat(button)}">${button.prompt}</button>
        `
      )}
    `;
  }

  async _addToChat(button) {
    const prompt = button.editable ? this.shadowRoot.querySelector('.editable-text').innerText : button.prompt;
    chatStore.addMessageToChatList(prompt);
    await this.chatStore.askOllamaApi(prompt);
  }

  _updatePrompt(event, button) {
    button.prompt = event.target.innerText;
  }
}

customElements.define('buttons-prompt', ButtonsPrompt);
