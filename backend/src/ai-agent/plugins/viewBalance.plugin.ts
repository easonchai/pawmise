import { Chain, PluginBase, createTool } from '@goat-sdk/core';
// import { Transaction } from "@mysten/sui/transactions";
import { z } from 'zod';
import { SuiWalletClient } from '@goat-sdk/wallet-sui';

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
});

export class ViewSUIBalancePlugin extends PluginBase<SuiWalletClient> {
  constructor() {
    super('viewSUIBalance', []);
  }

  supportsChain = (chain: Chain) => chain.type === 'sui';

  getTools(walletClient: SuiWalletClient) {
    return [
      createTool(
        {
          name: 'view_balance',
          description: 'View balance of an address.',
          parameters: viewBalanceParametersSchema,
        },
        async (parameters) => {
          const address = parameters.address || walletClient.getAddress();
          const balance = await walletClient.balanceOf(address);

          if (parameters.formatted) {
            const formattedAmount = (
              Number(balance.value) /
              10 ** balance.decimals
            ).toFixed(4);
            return `${formattedAmount} ${balance.symbol}`;
          }

          return balance;
        },
      ),
    ];
  }
}

export const viewBalance = () => new ViewSUIBalancePlugin();
