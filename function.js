import "dotenv/config";
import { openai } from "./openai.js";
import math from "advanced-calculator";
const QUESTION = process.argv[2] || "hi";

const messages = [
  {
    role: "user",
    content: QUESTION,
  },
];


const functions = {
  calculate: async ({expression}) => {
    return math.evaluate(expression);
  },
  generateImage: async ({prompt}) => {
    const generatedImage = await openai.images.generate({prompt})
    return generatedImage.data[0].url;
  }
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
      name: "generateImage",
      description: "generate an image",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description:
              'The prompt for which we need to generate image',
          },
        },
        required: ["prompt"],
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

  const responseMessage = response.choices[0].message;
  messages.push(responseMessage)
  

  // Step 2: check if the model wanted to call a function
  const toolCalls = responseMessage.tool_calls;

  

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

