import "dotenv/config";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { openai } from "./openai.js";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";

const question = process.argv[2] || "hi";

const video = `https://www.youtube.com/watch?v=pKXDVsWZmUU&t=10s`;

export const createStore = (docs) =>
  MemoryVectorStore.fromDocuments(
    docs,
    new OpenAIEmbeddings({ model: "text-embedding-3-large" })
  );

export const docsFromYTVideo = async (video) => {
  const loader = YoutubeLoader.createFromUrl(video, {
    language: "en",
    addVideoInfo: true,
  });
  const youtubeDoc = await loader.load();
  
  const splitter = new RecursiveCharacterTextSplitter({
    separators: " ",
    chunkSize: 6000,
    chunkOverlap: 100,
  });
  return await splitter.splitDocuments(youtubeDoc);
  
};

export const docsFromPDF = async() => {
  const loader = new PDFLoader("kroger.pdf");
  // const loader = new DocxLoader("some_docs.docx");
  
  const pdfDoc = await loader.load();
  
  const splitter = new RecursiveCharacterTextSplitter({
    separators: ". ",
    chunkSize: 6000,
    chunkOverlap: 100,
  });
  return await splitter.splitDocuments(pdfDoc);
};

const loadStore = async () => {
  const videoDocs = await docsFromYTVideo(video);
  const pdfDocs = await docsFromPDF();

  return createStore([...videoDocs, ...pdfDocs]);
};

const query = async () => {
  const store = await loadStore();
  const results = await store.similaritySearch(question, 1);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful AI assistant. Answer questions to your best ability based on context that I will provide. If question doesn't match with context, reply that you need more context",
      },
      {
        role: "user",
        content: `Answer the following question using the provided context.
        Question: ${question}
  
        Context: ${results.map((r) => r.pageContent).join("\n")}`,
      },
    ],
  });
  console.log(
    `Answer: ${response.choices[0].message.content}\n\nSources: ${results
      .map((r) => r.metadata.source)
      .join(", ")}`
  );
};

query();
