import { makeAutoObservable } from 'mobx';
import OllamaService from '../services/ollamaService';

	 
	class ChatStore {
	  lastId = 0;  // Contador para generar un ID único para cada mensaje
	  lastContext = [];  // Contador para generar un ID único para cada mensaje

	  // la propiedad reactiva almacenada junto con las actions en la store
	  messages = []; 
      messageContent = '';
	  isOllamaCommunicationFlag = false;
	  isSendingEmail = false;
	  user = "Tú";
	  count = 0;
	  icon = "fa fa-user";
	  userColor = "#3273dc";
	  variables = {};
	  welcome = "Bienvenido al chat. ¿Cómo puedo ayudarte?";
	  chat = {  icon: "fa fa-robot", 
	  			color: "#aaaaaa", 
				name: "Phi3", 
				buttons: [], 
		};
	 
	  constructor() {
	    makeAutoObservable(this); 
	    // la store la declaramos como un observable al que nos suscribiremos
	  }
	 
	  addMessageToChatList(message, context, icon = this.icon, color = this.userColor, user = this.user) { // las llamadas actions
		const newMessage = {
			text: message.trim(),
			context: context,
			color: color,
 		    id: ++this.lastId,  // Incrementa el contador y asigna el ID
			user: user, // Asumimos un usuario estático, puedes ajustar según sea necesario
			icon: icon // Clase de FontAwesome para el ícono del usuario
			};
			this.messages = [...this.messages, newMessage];
	  }

	   removeMessageById(id) {
			this.messages = this.messages.filter(message => message.id !== id);
		}

		getMessageById(id) {
			return this.messages.find(message => message.id === id);
		}

		toggleOllamaCommunicationFlag(){
			this.isOllamaCommunicationFlag = !this.isOllamaCommunicationFlag;
		}
		toggleEmailFlag(){
			this.isSendingEmail = !this.isSendingEmail;
		}

		updateMessageById(id, newText) {
			const message = this.messages.find(m => m.id === id);
			if (message) {
				message.text = newText;
				// Aquí puedes también disparar eventos o callbacks que indiquen que el mensaje ha sido actualizado
			}
		}

		updateMessageContent(newContent) {

			try {
				let jsonContent = JSON.parse(newContent); // Intenta analizar como JSON

				if (jsonContent && typeof jsonContent.response === 'string') {
					// Concatena el nuevo contenido de 'response' al ya existente
					this.messageContent += jsonContent.response;
				}

				if (jsonContent.context) {
					// Actualiza el contexto si está disponible
					this.lastContext = jsonContent.context;
				}

				if (jsonContent.done){
					//this.endCommunicationStream();
				}
			} catch (error) {
				// Si JSON.parse falla, se trata de una cadena simple
				this.messageContent += newContent; // Añade el texto simple a lo existente
			}
		}

		endCommunicationStream(){

			this.addMessageToChatList(this.messageContent, this.lastContext, this.chat.icon, this.chat.color, this.chat.name);
			this.messageContent = '';
		}

		setLastContext(contextArray){
			this.lastContext = contextArray;
		}



		// Método para reemplazar variables en un string
		replaceVariables(str) {
			return str.replace(/\$\{(.*?)\}/g, (match, varName) => this.variables[varName] || match);
		}

	 
	  setConfig(configuration){
		configuration.user? this.user = configuration.user : '';
		configuration.icon? this.icon = configuration.icon : '';
		configuration.variables? this.variables = configuration.variables : null;
		configuration.userColor? this.userColor = configuration.userColor : '';
		configuration.chat && configuration.chat.welcome? this.welcome = configuration.chat.welcome : '';
		configuration.chat && configuration.chat.icon? this.chat.icon = configuration.chat.icon : '';
		configuration.chat && configuration.chat.color? this.chat.color = configuration.chat.color : '';
		configuration.chat && configuration.chat.name? this.chat.name = configuration.chat.name : '';
		configuration.chat && configuration.chat.buttons? this.chat.buttons = configuration.chat.buttons : '';
		configuration.chat && configuration.chat.endpoint? this.chat.endpoint = configuration.chat.endpoint : console.error("No existen datos del Endpoint en la configuración, por favor rellene los datos");
		configuration.chat && configuration.chat.email? this.chat.email = configuration.chat.email : null; 
	  }

	  // usado para devolver y actualizar los datos del servidor ollama
	async askOllamaApi(question){
		this.toggleOllamaCommunicationFlag();
		let url = this.chat.endpoint.url;
		const ollamaService = new OllamaService(url);
		try {
			let body = this.chat.endpoint.body;
			body.prompt = question;
			this.chat.endpoint.beforeFirstPrompt && this.lastId == 1 ? body.prompt = this.chat.endpoint.beforeFirstPrompt + body.prompt : null;
			this.chat.endpoint.beforeAllPrompts? body.prompt = this.chat.endpoint.beforeAllPrompts + body.prompt : null;
			this.chat.endpoint.afterAllPrompts? body.prompt = body.prompt + this.chat.endpoint.afterAllPrompts : null;
			let data = await ollamaService.apiBypass(body, this.lastContext);
			console.log('Completion generated:', data);
			if(data !== undefined){

				if(data[0]=== "{"){
					data = JSON.parse(data);
				}
				this.addMessageToChatList(data.response, data.context, this.chat.icon, this.chat.color, this.chat.name);
				//this.lastContext = data.context;
    			data.context? this.setLastContext(this.lastContext.concat(data.context)) : null;
			}
		} catch (error) {
			console.error('Error:', error);
		} finally {
			this.toggleOllamaCommunicationFlag();
		}

	  }

	}
	 
	// exportamos la estore para que sea accesible para los wcs
	export const chatStore = new ChatStore();