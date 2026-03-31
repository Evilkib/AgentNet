import { GoogleGenerativeAI } from "@google/generative-ai";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { MemoryClient } from "mem0ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
const memory = new MemoryClient({ apiKey: process.env.MEM0_API_KEY });

export async function ceoWorkflow(userId, userMessage) {
  "use workflow"; 

  // Security: Neural Wipe / Ban Check
  const memories = await memory.search("USER_IS_BANNED", { user_id: userId });
  if (memories.length > 0) return "Access Denied: Neural Wipe Active."; 

  // Retrieve Context & Process with Jules logic
  const history = await memory.search(userMessage, { user_id: userId });
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent([`Context: ${history}`, userMessage]);
  const response = result.response.text();

  // Neynar Social Broadcast
  if (response.includes("[BROADCAST]")) {
    await neynar.publishCast(process.env.SIGNER_UUID, response.replace("[BROADCAST]", ""));
  }

  await memory.add([{ role: "user", content: userMessage }, { role: "assistant", content: response }], { user_id: userId });
  return response;
}
