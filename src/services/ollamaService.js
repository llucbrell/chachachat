import { chatStore } from "../stores/chatStore";

class OllamaService {
  constructor(apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
  }


 async apiBypass(body, context) {
  let data = {};
  chatStore.chat.endpoint.body.stream? data = await this.ollamaStream(body, context) : data = await this.ollamaNotStream(body, context);
  return data;
 }

async ollamaStream(body, context, apiBaseUrl) {
  console.log("Envío de datos al endpoint strimeando:", JSON.stringify(body));
  try {
    body.context = context;
    const response = await fetch(`${this.apiBaseUrl}`, {  // Corregido `${this.apiBaseUrl}` a `${apiBaseUrl}`
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error calling Ollama generate API:', errorText);
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    let finalData = '';
    let balance = 0; // Balance de llaves para identificar objetos completos
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decodifica el valor como texto
      const textChunk = new TextDecoder("utf-8").decode(value, {stream: true});
      finalData += textChunk;

      // Procesar cada carácter para mantener el balance de llaves
      for (let char of textChunk) {
        if (char === '{') balance++;
        if (char === '}') balance--;
        
        // Cuando el balance llega a cero, tenemos un objeto JSON completo
        if (balance === 0 && finalData.trim()) {
          chatStore.updateMessageContent(finalData);
          finalData = ''; // Resetear finalData después de procesar un objeto completo
        }
      }
    }

      console.log('Stream completed');
      chatStore.endCommunicationStream();
    if (finalData.trim()) {  // Procesa cualquier fragmento restante que podría no haberse cerrado correctamente
      chatStore.updateMessageContent(finalData);

    }

  } catch (error) {
    console.error('Error calling Ollama generate API:', error);
    throw error;
  }
}

/*
async ollamaStream(body, context){

  console.log("Envío de datos al endpoint strimeando:", JSON.stringify(body));
  try {
    body.context = context;
    const response = await fetch(`${this.apiBaseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error calling Ollama generate API:', errorText);
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

      let finalData = '';
      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        finalData += new TextDecoder("utf-8").decode(value);
        console.log(finalData);
        
      }

      console.log('Stream completed:', finalData);
      return JSON.parse(finalData); // Asegúrate de que el endpoint devuelve JSON válido
    } catch (error) {
    console.error('Error calling Ollama generate API:', error);
    throw error;
  }
}
*/
 
async ollamaNotStream(body, context, stream = false) {

  console.log("Envío de datos al endpoint Sin Strimear:", JSON.stringify(body));
    try {
      body.context = context;
      const response = await fetch(`${this.apiBaseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      console.log("Envío de datos al endpoint:" + body);
      console.log(JSON.stringify(body));
      if (!response.ok) {
        const errorText = await response.text();
        alert("Hubo un problema con el Endpoint:\n\n" + errorText );
        throw new Error(`Error calling Ollama generate API: ${errorText}`);
      }
      const blob = await response.blob();
      const data = await blob.text();
      return data;
    } catch (error) {
      console.error('Error calling Ollama generate API:', error);
      throw error;
    }
  }




async generateCompletion(model, prompt, context, stream = false) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model, prompt, context, stream })
      });
      console.log(JSON.stringify({ model, prompt, context, stream }))
      if (!response.ok) {
        const errorText = await response.text();
        alert("Hubo un problema con el Endpoint:\n\n" + errorText );
        throw new Error(`Error calling Ollama generate API: ${errorText}`);
      }
      const blob = await response.blob();
      const data = await blob.text();
      return JSON.parse(data);
    } catch (error) {
      console.error('Error calling Ollama generate API:', error);
      throw error;
    }
  }

  async createModel(name, modelfile) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, modelfile })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error creating model in Ollama API: ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating model in Ollama API:', error);
      throw error;
    }
  }

  async generateChatCompletion(model, messages, stream = false) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model, messages, stream })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error calling Ollama chat API: ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error calling Ollama chat API:', error);
      throw error;
    }
  }
}

export default OllamaService;
