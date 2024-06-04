// create singleton function to get openai
import OpenAI from 'openai';

export const openai = new OpenAI(process.env.OPENAI_API_KEY);