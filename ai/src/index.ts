import readline from "node:readline";

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
  decodeSuiPrivateKey,
} from "@mysten/sui/cryptography";
import { SuiKeyPairWalletClient } from "@goat-sdk/wallet-sui";

import { getOnChainTools } from "@goat-sdk/adapter-vercel-ai";

import * as dotenv from "dotenv";
// import { myPlugin } from "./plugins/checkSUIBalance.plugin";
import { viewBalance } from "plugins/viewBalance.plugin";
import { TokenPlugin } from "plugins/tokenHandler.plugin";
import { NftSUIPlugin } from "plugins/nftHandler.plugin";

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

dotenv.config();

// Step 1: Initialize Sui client and wallet
const suiClient = new SuiClient({
  url: "https://fullnode.devnet.sui.io:443", // Or your preferred RPC endpoint
});

// Create or import a keypair (this example uses a private key)
const bech32PrivateKey = process.env.PK;

if (!bech32PrivateKey) {
  throw new Error("PK environment variable is not set");
}

const { schema, secretKey } = decodeSuiPrivateKey(bech32PrivateKey);

const keypair = Ed25519Keypair.fromSecretKey(secretKey);

// Initialize the wallet client
const walletClient = new SuiKeyPairWalletClient({
  client: suiClient,
  keypair: keypair,
});

const history = [];

(async () => {
  // 2. Get your onchain tools for your wallet
  const tools = await getOnChainTools({
    wallet: walletClient,
    plugins: [new NftSUIPlugin(), new TokenPlugin()],
  });

  // 3. Create a readline interface to interact with the agent
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    const prompt = await new Promise<string>((resolve) => {
      rl.question('Enter your prompt (or "exit" to quit): ', resolve);
    });

    const newMessage: Message = {
      role: 'user', content: prompt
    }

    history.push(newMessage);

    if (prompt === "exit") {
      rl.close();
      break;
    }

    console.log("\n-------------------\n");
    console.log("TOOLS CALLED");
    console.log("\n-------------------\n");
    try {
      const result: any = await generateText({
        model: openai("gpt-4o-mini"),
        tools: tools,
        maxSteps: 10, // Maximum number of tool invocations per request
        messages: history as Message[],
        // prompt: prompt,
        onStepFinish: (event) => {
          console.log(event.toolResults);
        },
      });

      console.log("\n-------------------\n");
      console.log("RESPONSE");
      console.log("\n-------------------\n");
      console.log(result.text);
      console.log("FULL response: ", result.response.messages)
      history.push({role: 'assistant', content: result.text});

      console.log("\n-------------------\n");
      console.log("HISTORY")
      console.log("\n-------------------\n");
      console.log(history);
    } catch (error) {
      console.error(error);
    }
    console.log("\n-------------------\n");
  }
})();
