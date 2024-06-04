// create a simple chat application that can be invoked from terminal, it will use open-ai to provide response to the queries
// import 'dotenv/config';
import { openai } from './openai.js';
import readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const getNewMessage = async (history, message, stream=false) => {
  const chatCompletion = await openai.chat.completions.create({
    messages: [...history, message],
    model: 'gpt-4o',
    stream
  })
  if(stream) {
    for await (const chunk of chatCompletion) {
        process.stdout.write(chunk.choices[0]?.delta?.content || "");
    }
    return;
  }
  return chatCompletion.choices[0].message
}

const formatMessage = (content) => ({role: 'user', content})

const chat = () => {
  const history = [
    {
      role: 'system',
      content: `You are a helpful assistant that provides information. Answer the user's questions to the best of your ability`
    }
  ]

  const start = () => {
    rl.question('You: ', async (message) => {
      if(message.toLowerCase() === 'exit') {
        rl.close()
        return
      }

      const userMessage = formatMessage(message)
      const response = await getNewMessage(history, userMessage, false)
      

      response?.content && history.push(userMessage, response);

      response?.content && console.log(`\n\nAI: ${response?.content}\n\n`);
      start()
    })
  }
  start()
  console.log(`\n\nAI: How can I help you today?`)
}

console.log("Chatbot Initialized. Type 'exit' to quit")
chat()