import { LitElement, html, css } from 'lit';
import { autorun } from 'mobx';
import { chatStore } from '../stores/chatStore.js';
import { jsPDF } from 'jspdf';
import OllamaService from '../services/ollamaService';

class MessageItem extends LitElement {
  static styles = css`
    :host {
      display: block; /* Asegura que el host ocupe todo el ancho disponible */
      margin-bottom: 0.2rem;
    }
    .message-item {
      display: flex;
      align-items: center; /* Alinea los elementos al centro verticalmente */
      padding: 0.1rem;
      padding-bottom: 0.1rem;
    }
   .text-format {
      display: block; /* Asegura que el texto ocupe su propia línea */
      white-space: pre-wrap; /* Preserva espacios y saltos de línea y permite el ajuste de palabra */
      padding: 0.1rem;
      padding-top: 0rem;
      padding-bottom: 0.6rem;
    }
    .message-buttons{
      margin-left: 35%;
      float:left;
      color: grey;
      padding-bottom: 0.1rem;
    }
    .icono{
      padding: 1.9rem;
      font-size: 25px;
    }
    .icon-button {
      font-size: 10px;
      float:right;
      border: none;
      background: none;
      cursor: pointer;
      color: inherit; /* Hereda el color de su contenedor */
      padding: 0.5rem;
      display: flex; /* Asegura que el icono esté centrado en el botón */
      align-items: center;
    }
    .user-name{
      font-size: 20px;
    }

    .icon-button:hover{
      color: hsl(217, 71%, 53%);
      font-size: 11px;
    }
    
    .editable {
      outline: none;  // Remueve el contorno que aparece cuando el elemento es editable
      cursor: text;
    }
    textarea {
      width:100%;
    }
    .chat-input {
      display: flex;
      padding: 1rem;
    }
    .input, .button {
      margin: 0.5rem;
    }
  `;

  static properties = {
    message: { type: Object },
    email: { type: String },  // Almacenará la dirección de correo del destinatario
    isLoading: { type: Boolean },
   isEditable: { type: Boolean }  // Nueva propiedad para controlar la edición

  };

  constructor(){
    super();
    this.message = { text: "", user: "Tú" };
    this.editing = false; // Nuevo estado para gestionar si se está editando el mensaje
    this.isEditable = false;
    this.email = '';  // Inicializa el email como un string vacío
    this.subject = '';  // Inicializa el asunto como un string vacío
    this.mailBox = false;
    this.isLoading = false;


    this.disposeAutorun = autorun(() => {
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
  const { id, user, text, icon, color } = this.message; // Asegúrate de incluir el 'id' en el destructuring si es necesario
  return html`
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css">
    <div class="message-item">
      <span class="icono" style="color: ${color}">
        ${icon ? html`<i class="${icon}"></i>` : html``}
      </span>
      <span class="user-name" style="color: ${color}">${user}</span>
     
     
      
   
   
    </div>
    </div>


     

   ${!this.isEditable ? html`
      <div class="text-format" contenteditable="${this.isEditable}" @input="${this.handleInput}" @blur="${this.handleBlur}">
        ${this.message.text}
      </div>` : html`
      <textarea class="text-format" @input="${this.handleInput}" @blur="${this.handleBlur}">
        ${this.message.text}
      </textarea>
    `} 



   ${this.mailBox? html`
      <!-- Campo para ingresar la dirección de correo electrónico -->

      <div class="chat-input" style="float:right">
    ${!this.chatStore.chat || !this.chatStore.chat.email || !this.chatStore.chat.email.subject ?
        html `
        <input type="text" placeholder="Asunto del correo" class="input" .value="${this.subject}" @input="${this.updateSubject}">
        `: html `` 
      }
      ${!this.chatStore.chat || !this.chatStore.chat.email || !this.chatStore.chat.email.to ?
        html `
        <input type="email" placeholder="Correo de destino" class="input" .value="${this.email}" @input="${this.updateEmail}">
        `: html `` 
      }
        <button ?disabled="${this.chatStore.isSendingEmail}" class="button send"  @click="${this.sendEmail}">
          ${this.chatStore.isSendingEmail ? html`Enviando<span class="spinner"></span>` : html`Enviar`}
        </button>
    </div>
      
    ` : html`
    `}


 <div class="message-buttons"> 
      <button class="icon-button" @click="${() => this.deleteMessage(id)}">
        <i class="fas fa-trash"></i>
      </button>
      <button class="icon-button" @click="${() => this.resendMessage(id)}">
        <i class="fas fa-redo"></i>
      </button>
      <button class="icon-button" @click="${() => this.copyMessage(id)}">
        <i class="fas fa-file"></i>
      </button>
      ${this.chatStore.chat.email? html `
        <button class="icon-button" @click="${this.toggleMail}">
          <i class="fas fa-envelope"></i>
        </button>
      ` : html ``
      }
     <button class="icon-button" @click="${this.downloadAsText}">
          <i class="fas fa-file-alt"></i>
        </button>
        <button class="icon-button" @click="${this.downloadAsPdf}">
          <i class="fas fa-file-pdf"></i>
        </button> 
    ${!this.isEditable? html`
  <button class="icon-button" @click="${this.toggleEdit}">
        <i class="fas fa-edit"></i>
      </button>
    ` : html`
    <button class="icon-button" @click="${this.toggleEdit}">
        <i class="fas fa-save"></i>
      </button>
    `}

    </div>
  `;
}
 
getMessageContent() {
  const message = this.chatStore.getMessageById(this.message.id);
  if (!message) {
    console.error('Mensaje no encontrado');
    return '';
  }
  return `${message.user}: ${message.text}`;
}

resendMessage(messageId) {
  const message = this.chatStore.getMessageById(messageId);
  if (!message) {
    console.error('Mensaje no encontrado');
    return;
  }
  console.log(message);

  if(confirm("Se va a proceder a enviar de nuevo, todos los mensajes posteriores se eliminarán de la lista y no se podrán recuperar.\n¿Está seguro?")){
      this.chatStore.addMessageToChatList(message.text, message.context, this.chatStore.icon, this.chatStore.userColor, this.chatStore.user);
      this.askOllamaForResend(message);
  }
}




  async askOllamaForResend(message){
    // usamos la configuración del enpoint (manitou) para gestionar lastContext de la forma correcta
    if(this.chatStore.chat.endpoint.manitou){
      console.log("Gestionamos lastIndex con langchain");
    }else{
 
        this.chatStore.setLastContext(message.context)
        this.chatStore.askOllamaApi(message.text);


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
          const data = await ollamaService.apiBypass(body, message.context);
          console.log('Completion generated:', data);
          if(data !== undefined){
            this.chatStore.addMessageToChatList(data.response, data.context, this.chatStore.chat.icon, this.chatStore.chat.color, this.chatStore.name);
            this.chatStore.lastContext = data.context;
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
    window.scrollTo(0, document.body.scrollHeight);
    
  }

  updateEmail(event) {
    this.email = event.target.value;  // Actualiza la dirección de correo electrónico conforme el usuario la introduce
  }
  updateSubject(event) {
    this.subject = event.target.value;  // Actualiza la dirección de correo electrónico conforme el usuario la introduce
  }

 
sendEmail() {

  this.chatStore.chat && this.chatStore.chat.email && this.chatStore.chat.email.to ? this.email = this.chatStore.chat.email.to : null;
  this.chatStore.chat && this.chatStore.chat.email && this.chatStore.chat.email.subject ? this.subject = this.chatStore.chat.email.subject : null;
  if (this.email && this.subject) {
    if (confirm("¿Estás seguro de que quieres enviar este correo electrónico?")) {
      this.chatStore.toggleEmailFlag();
      let emailData = {
        to: this.email,
        subject: this.subject,
        text: this.getMessageContent(),
      };
      
      this.chatStore.chat.email.extra? emailData.extra = this.chatStore.chat.email.extra : null; 

      fetch( this.chatStore.chat.email.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      })
      .then(response => {
        // Primero verificamos el estado de la respuesta
        if (!response.ok) {
          // Si la respuesta no es exitosa, lanzamos un error que será capturado por el catch
          throw new Error('Failed to send email. Status: ' + response.status);
        }
        return response.json(); // Convertimos la respuesta a JSON sólo si es exitosa
      })
      .then(data => {
        // Si todo va bien, gestionamos el éxito
        console.log('Correo enviado:', data);
        alert("Correo enviado con éxito!");
      })
      .catch(error => {
        // Capturamos cualquier error desde el fetch hasta la conversión de JSON
        console.error('Error al enviar correo:', error);
        alert("Error al enviar el correo: " + error.message);
      })
      .finally(() => {
        // Finalmente, restablecemos el indicador de carga independientemente del resultado
        this.chatStore.toggleEmailFlag();
      });
    }
  } else {
    alert("Por favor, introduce una dirección de correo electrónico y asunto válidos.");
  }
}
 


toggleMail() {
  this.mailBox = !this.mailBox;
  this.requestUpdate();
}

toggleEdit() {
  // Simply toggle the editable state
  this.isEditable = !this.isEditable;

  // If exiting edit mode, update the message text from the editable element
  if (!this.isEditable) {
    const textContent = this.shadowRoot.querySelector('.text-format').textContent.trim();
    if (textContent !== this.message.text) {
      this.message.text = textContent;
      this.chatStore.updateMessageById(this.message.id, this.message.text);
    }
  }

  this.requestUpdate();  // Request an update to re-render

  // Focus the element after update, if entering edit mode
  if (this.isEditable) {
    this.updateComplete.then(() => {
      const editableElement = this.shadowRoot.querySelector('.text-format');
      if (editableElement) editableElement.focus();
    });
  }
}

handleInput(e) {
  // Actualiza el texto del mensaje directamente desde el evento de entrada
  // Asegúrate de que estás usando el evento y el target correctos
  if (this.isEditable) {
    const newText = e.target.value; // Para textarea o e.target.textContent para div con contenteditable
    this.message.text = newText; // Asegúrate de que este es el camino correcto para actualizar tu estado
    this.requestUpdate(); // Pide a LitElement que actualice el componente
  }
}

handleBlur() {
  // Aquí podrías llamar a tu función de actualización del store
  this.chatStore.updateMessageById(this.message.id, this.message.text);
  this.requestUpdate();
}




 

  updateMessage(e) {
    this.message.text = e.target.value;
  }

  saveMessage() {
    // Aquí deberías implementar la lógica para actualizar el mensaje en el chatStore
    this.chatStore.updateMessageById(this.message.id, this.message.text);
    this.editing = false;
    this.requestUpdate();
  }

copyMessage(id) {
  const message = this.chatStore.getMessageById(id); // Asegúrate de tener este método o ajusta según tu implementación
  if (message) {
    navigator.clipboard.writeText(message.text).then(() => {
      alert("Mensaje copiado al portapapeles");
    }).catch(err => {
      console.error('Error al copiar texto: ', err);
    });
  }
}



downloadAsPdf() {
  const content = this.getMessageContent();
  if (!content) return;  // No proceder si no hay contenido.

  const doc = new jsPDF();

  // Define márgenes y dimensiones
  const marginLeft = 10;
  const marginTop = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - 2 * marginLeft; // Asegura un margen en ambos lados

  // Añade el texto con ajuste automático
  doc.text(content, marginLeft, marginTop, { maxWidth: maxWidth });

  doc.save('message.pdf');
}


deleteMessage(id) {
  if (confirm("¿Estás seguro de que deseas eliminar este mensaje?")) {
    this.chatStore.removeMessageById(id);
    this.requestUpdate(); // Actualiza el componente si es necesario
  }
}

downloadAsText() {
  const content = this.getMessageContent();
  if (!content) return;  // No proceder si no hay contenido.

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'message.txt';
  document.body.appendChild(a); // Esto asegura que funcione en algunos navegadores.
  a.click();
  document.body.removeChild(a); // Limpia agregando y removiendo el elemento.
  URL.revokeObjectURL(url);
}



}

customElements.define('message-item', MessageItem);
