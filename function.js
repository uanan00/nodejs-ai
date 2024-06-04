import "dotenv/config";
import { openai } from "./openai.js";
import math from "advanced-calculator";
import sendEmail from "./utils/sendEmail.js";
const QUESTION = process.argv[2] || "hi";

const messages = [
  {
    role: "user",
    content: QUESTION,
  },
];

console.log('Question', QUESTION)

const functions = {
  calculate: async ({expression}) => {
    return math.evaluate(expression);
  },
  sendEmail: async({to, subject, text}) => await sendEmail({to, subject, text})
};

const tools = [
  {
    type: "function",
    function: {
      name: "calculate",
      description: "Run a math expression",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description:
              'Then math expression to evaluate like "2 * 3 + (21 / 2) ^ 2"',
          },
        },
        required: ["expression"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "sendEmail",
      description: "Send a mail to user with subject and text",
      parameters: {
        type: "object",
        properties: {
          to: {
            type: "string",
            description: "The email address of user to send mail to",
          },
          subject: {
            type: "string",
            description: "Subject of email",
          },
          text: {
            type: "string",
            description: "The text that we want to send in email",
          },
        },
        required: ["to", 'subject', 'text'],
      },
    },
  },
];

const getCompletion = async (messages) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    tools: tools,
    temperature: 0,
  });

  return response;
};

let response;

  response = await getCompletion(messages);
  console.log('response', response)

  const responseMessage = response.choices[0].message;
  messages.push(responseMessage)
  

  // Step 2: check if the model wanted to call a function
  const toolCalls = responseMessage.tool_calls;

  console.log('toolCalls', toolCalls)

  if (responseMessage.tool_calls) {
    
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const functionToCall = functions[functionName];
      const functionArgs = JSON.parse(toolCall.function.arguments);
    
      const functionResponse = await functionToCall(functionArgs);
      console.log('function', functionResponse)
      messages.push({
        tool_call_id: toolCall.id,
        role: "tool",
        name: functionName,
        content: `${functionResponse}`,
      }); // extend conversation with function response
    }
  }

  const functionResponse = await getCompletion(messages);

  console.log(`Ai: ${functionResponse.choices[0].message.content} `)

