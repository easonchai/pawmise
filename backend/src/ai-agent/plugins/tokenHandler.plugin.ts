import { Chain, PluginBase, createTool } from '@goat-sdk/core';
import { Transaction } from '@mysten/sui/transactions';
import { z } from 'zod';
import { SuiWalletClient } from '@goat-sdk/wallet-sui';

const COMMON_TOKENS = {
  SUI: '0x2::sui::SUI',
  USDC: '0x0b50524fcb74867e27dc364f0cd2d66c4d466b2555933e87dca0bca8689e252d::usdc::USDC', // Example address
  USDT: '0x0b50524fcb74867e27dc364f0cd2d66c4d466b2555933e87dca0bca8689e252d::coin::COIN', // Example address
} as const;

// ---------------------HELPER FUNCTIONS-------------------------------
async function getCoinsOfType(walletClient: SuiWalletClient, coinType: string) {
  const client = walletClient.getClient();
  const owner = walletClient.getAddress();

  // Query for all coins of the specified type owned by this address
  const coinsResponse = await client.getCoins({
    owner,
    coinType,
  });

  return coinsResponse.data;
}

async function getTokenMetadata(
  walletClient: SuiWalletClient,
  coinType: string,
) {
  // For SUI, we can assume standard values
  if (coinType === COMMON_TOKENS.SUI) {
    return {
      symbol: 'SUI',
      decimals: 9, // SUI has 9 decimals
    };
  }

  // For other tokens, try to fetch metadata from the blockchain
  // This is a simplified approach - you might need to adjust based on
  // how token metadata is actually stored on Sui for each token
  try {
    const client = walletClient.getClient();
    // This is a placeholder - you'll need to use the appropriate Sui API
    // to fetch coin metadata based on the coin type
    const metadata = await client.getCoinMetadata({ coinType });
    return {
      symbol: metadata?.symbol || coinType.split('::').pop() || 'UNKNOWN',
      decimals: metadata?.decimals || 9, // Default to 9 if unknown
    };
  } catch (error) {
    console.error(error);
    // If metadata fetch fails, use reasonable defaults
    return {
      symbol: coinType.split('::')[2] || 'TOKEN',
      decimals: 9,
    };
  }
}

// NOTE: This is in mist or whatever it is, so have to multiply 1e9
const sendTokenParametersSchema = z.object({
  to: z.string().describe("The recipient's address"),
  amount: z.number().describe('The amount of token to send'),
  tokenType: z
    .enum(['SUI', 'USDC', 'USDT'])
    .describe('The type of token to send'),
});

const viewBalanceParametersSchema = z.object({
  address: z
    .string()
    .optional()
    .describe(
      'The address to check (defaults to current wallet if not provided)',
    ),
  formatted: z
    .boolean()
    .optional()
    .describe('Whether to return a human-readable format'),
  tokenType: z
    .enum(['SUI', 'USDC', 'USDT'])
    .describe('The type of token to send'),
});

const sendTokenMethod = async (
  walletClient: SuiWalletClient,
  parameters: z.infer<typeof sendTokenParametersSchema>,
) => {
  const { to, amount, tokenType } = parameters;
  const tx = new Transaction();

  // For SUI tokens, use the simpler approach
  if (tokenType === 'SUI') {
    // Simple SUI transfer using gas object
    const [coin] = tx.splitCoins(tx.gas, [amount]);
    tx.transferObjects([coin], to);
  } else {
    // For other tokens, we need to look them up first
    const actualTokenType = COMMON_TOKENS[tokenType];
    const tokens = await getCoinsOfType(walletClient, actualTokenType);

    if (tokens.length === 0) {
      throw new Error(`No ${tokenType} tokens found in wallet`);
    }

    // Use the first coin object that has enough balance
    const suitableCoin = tokens.find(
      (token) => Number(token.balance) >= amount,
    );

    if (suitableCoin) {
      // If we found a single coin with enough balance, use it directly
      const [splitToken] = tx.splitCoins(tx.object(suitableCoin.coinObjectId), [
        amount,
      ]);
      tx.transferObjects([splitToken], to);
    } else {
      // If no single coin has enough, merge coins until we have enough
      let totalBalance = 0;
      const tokensToUse: string[] = [];

      // Find coins to merge until we have enough balance
      for (const token of tokens) {
        totalBalance += Number(token.balance);
        tokensToUse.push(token.coinObjectId);

        if (totalBalance >= amount) break;
      }

      if (totalBalance < amount) {
        throw new Error(
          `Insufficient ${tokenType} balance: have ${totalBalance}, need ${amount}`,
        );
      }

      // Merge coins and split the amount
      const primaryToken = tx.object(tokensToUse[0]);
      if (tokensToUse.length > 1) {
        const otherTokens = tokensToUse.slice(1).map((id) => tx.object(id));
        tx.mergeCoins(primaryToken, otherTokens);
      }

      const [splitToken] = tx.splitCoins(primaryToken, [amount]);
      tx.transferObjects([splitToken], to);
    }
  }

  // Build and send the transaction
  return walletClient.sendTransaction({
    transaction: tx,
  });
};

// const sendTokenMethod = async (
//   walletClient: SuiWalletClient,
//   parameters: z.infer<typeof sendSUIParametersSchema>,
// ) => {
//   const { to, amount, tokenType } = parameters;
//   const tx = new Transaction();
//   tx.setSender(walletClient.getAddress());
//
//   const actualTokenType = COMMON_TOKENS[tokenType];
//   const tokens = await getCoinsOfType(walletClient, actualTokenType);
//
//   if (tokens.length === 0) {
//     throw new Error(`No ${tokenType} tokens found in wallet`);
//   }
//
//   let totalBalance = 0;
//   const tokensToUse = [];
//
//   for (const token of tokens) {
//     totalBalance += Number(token.balance);
//     tokensToUse.push(token.coinObjectId);
//
//     if (totalBalance >= amount) break;
//   }
//
//   if (totalBalance < amount) {
//     throw new Error(
//       `Insufficient ${tokenType} balance: have ${totalBalance}, need ${amount}`,
//     );
//   }
//
//   if (tokensToUse.length === 1) {
//     const [splitToken] = tx.splitCoins(tx.object(tokensToUse[0]), [amount]);
//     tx.transferObjects([splitToken], to);
//   } else {
//     const primaryToken = tx.object(tokensToUse[0]);
//     const otherTokens = tokensToUse.slice(1).map((id) => tx.object(id));
//
//     tx.mergeCoins(primaryToken, otherTokens);
//     const [splitToken] = tx.splitCoins(primaryToken, [amount]);
//     tx.transferObjects([splitToken], to);
//   }
//
//   // const [coin] = tx.splitCoins(tx.gas, [amount]);
//   // tx.transferObjects([coin], to);
//   await tx.build({ client: walletClient.getClient() });
//   return walletClient.sendTransaction({
//     transaction: tx,
//   });
// };

const viewBalanceMethod = async (
  walletClient: SuiWalletClient,
  parameters: z.infer<typeof viewBalanceParametersSchema>,
) => {
  // const address = parameters.address || walletClient.getAddress();
  const tokenType = parameters.tokenType;
  const actualTokenType = COMMON_TOKENS[tokenType];

  // Get all coins of the specified type
  const coins = await getCoinsOfType(walletClient, actualTokenType);

  // Calculate total balance
  let totalBalance = 0;
  for (const coin of coins) {
    totalBalance += Number(coin.balance);
  }

  // Get token metadata for formatting
  const metadata = await getTokenMetadata(walletClient, actualTokenType);

  // Format the response
  if (parameters.formatted) {
    const formattedAmount = (totalBalance / 10 ** metadata.decimals).toFixed(4);
    return `${formattedAmount} ${metadata.symbol}`;
  }

  // Return detailed balance information
  return {
    value: totalBalance.toString(),
    decimals: metadata.decimals,
    symbol: metadata.symbol,
    coinType: actualTokenType,
    coins: coins.length,
  };
};

export class TokenPlugin extends PluginBase<SuiWalletClient> {
  constructor() {
    super('tokenTools', []);
  }

  supportsChain = (chain: Chain) => chain.type === 'sui';

  getTools(walletClient: SuiWalletClient) {
    const sendTool = createTool(
      {
        name: 'send_tokens',
        description: 'Send tokens to an address.',
        parameters: sendTokenParametersSchema,
      },
      // Implement the method
      (parameters: z.infer<typeof sendTokenParametersSchema>) =>
        sendTokenMethod(walletClient, parameters),
    );
    const viewBalanceTool = createTool(
      {
        name: 'view_balance',
        description: 'View balance of a token of an address.',
        parameters: viewBalanceParametersSchema,
      },
      // Implement the method
      (parameters: z.infer<typeof viewBalanceParametersSchema>) =>
        viewBalanceMethod(walletClient, parameters),
    );
    return [sendTool, viewBalanceTool];
  }
}
