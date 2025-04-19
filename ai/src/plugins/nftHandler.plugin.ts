import { Chain, PluginBase, createTool } from "@goat-sdk/core";
import { Transaction } from "@mysten/sui/transactions";
import { z } from "zod";
import { SuiWalletClient } from "@goat-sdk/wallet-sui";

// const contractAddress = "0x80a711cc6cc1f06067c915a672861f07c457616acb2570f0d3a7889f6f24847a";
const contractAddress = "0x1e9ab043a94e004340dcb037eb028cbab3a567aca76f0ee8b0ca0c0fe745b6e4";

const mintNFTParametersSchema = z.object({
  address: z.string().describe("The Address of wallet to mint nft to")
  // to: z.string().describe("The recipient's address"),
  // amount: z.number().describe("The amount of SUI to send"),
});

const upgradeNFTParametersSchema = z.object({
  nftId: z.string().describe("The ID of the NFT to upgrade"),
  // amount: z.number().describe("The amount of SUI to send"),
});

const updateDescriptionParametersSchema = z.object({
  nftId: z.string().describe("The ID of the NFT to update description"),
  description: z.string().describe("The new description of the NFT"),
  // amount: z.number().describe("The amount of SUI to send"),
});

const updateImageUrlParametersSchema = z.object({
  nftId: z.string().describe("The ID of the NFT to update image url"),
  imageUrl: z.string().describe("The new imageUrl of the NFT"),
  // amount: z.number().describe("The amount of SUI to send"),
});

const burnNFTParametersSchema = z.object({
  nftId: z.string().describe("The ID of the NFT to burn"),
  // amount: z.number().describe("The amount of SUI to send"),
});

const mintNFTMethod = async (
  walletClient: SuiWalletClient,
  parameters: z.infer<typeof mintNFTParametersSchema>,
) => {
  // const { to, amount } = parameters;
  const tx = new Transaction();
  // TODO: ADD counter object id
  const counterObjectId = "0x16e67d0c9186a41cf1b90bd8d5e6fbdbc2e717628e5eccc2e36e365399b0978f";

  const sender = walletClient.getAddress();
  const {address} = parameters;
  // console.log("ADDRESSSSSSSSSSSSSSSSSS: ", contractAddress)
  tx.setSender(sender);
  const [mintedNFT] = tx.moveCall({
    // WARN: replace first pawmise with contract address
    target: `${contractAddress}::pawmise::mint`,
    arguments: [
      tx.object(counterObjectId),
      tx.pure.string("Forest Realm"), // name
      tx.pure.string("A magical forest"), // description
      tx.pure.string("ipfs://forest.png"), // image_url
      tx.pure.address(address), // creator address (using the wallet's address)
    ],
  });

  tx.transferObjects([mintedNFT], address);
  await tx.build({ client: walletClient.getClient() });

  const result = await walletClient.sendTransaction({ transaction: tx });
  console.log("RESULT: ", result)

  // TODO: Check if this is correct
  await walletClient.getClient().waitForTransaction({ digest: result.hash });

  return result;
};

const upgradeNFTMethod = async (
  walletClient: SuiWalletClient,
  parameters: z.infer<typeof upgradeNFTParametersSchema>,
) => {
  const { nftId } = parameters;
  const tx = new Transaction();
  tx.setSender(walletClient.getAddress());
  tx.moveCall({
    target: `${contractAddress}::pawmise::upgrade_tier`,
    arguments: [tx.object(nftId)],
  });

  await tx.build({ client: walletClient.getClient() });

  const result = await walletClient.sendTransaction({ transaction: tx });

  // TODO: Check if this is correct
  await walletClient.getClient().waitForTransaction({ digest: result.hash });

  return result;
};

const updateDescriptionMethod = async (
  walletClient: SuiWalletClient,
  parameters: z.infer<typeof updateDescriptionParametersSchema>,
) => {
  const { nftId, description } = parameters;
  const tx = new Transaction();
  tx.setSender(walletClient.getAddress());
  tx.moveCall({
    target: `${contractAddress}::pawmise::update_description`,
    arguments: [tx.object(nftId), tx.pure.string(description)],
  });

  await tx.build({ client: walletClient.getClient() });

  const result = await walletClient.sendTransaction({ transaction: tx });

  // TODO: Check if this is correct
  await walletClient.getClient().waitForTransaction({ digest: result.hash });

  return result;
};

const updateImageUrlMethod = async (
  walletClient: SuiWalletClient,
  parameters: z.infer<typeof updateImageUrlParametersSchema>,
) => {
  const { nftId, imageUrl } = parameters;
  const tx = new Transaction();
  tx.setSender(walletClient.getAddress());
  tx.moveCall({
    target: `${contractAddress}::pawmise::update_image_url`,
    arguments: [tx.object(nftId), tx.pure.string(imageUrl)],
  });

  await tx.build({ client: walletClient.getClient() });

  const result = await walletClient.sendTransaction({ transaction: tx });

  // TODO: Check if this is correct
  await walletClient.getClient().waitForTransaction({ digest: result.hash });

  return result;
};

const burnNFTMethod = async (
  walletClient: SuiWalletClient,
  parameters: z.infer<typeof upgradeNFTParametersSchema>,
) => {
  const { nftId } = parameters;
  const tx = new Transaction();
  tx.setSender(walletClient.getAddress());
  tx.moveCall({
    target: `${contractAddress}::pawmise::burn`,
    arguments: [tx.object(nftId)],
  });

  await tx.build({ client: walletClient.getClient() });

  const result = await walletClient.sendTransaction({ transaction: tx });

  // TODO: Check if this is correct
  await walletClient.getClient().waitForTransaction({ digest: result.hash });

  return result;
};

export class NftSUIPlugin extends PluginBase<SuiWalletClient> {
  constructor() {
    super("nftContractTools", []);
  }

  supportsChain = (chain: Chain) => chain.type === "sui";

  getTools(walletClient: SuiWalletClient) {
    const mintTool = createTool(
      {
        name: "mint_nft",
        description: "Mint a NFT to self",
        parameters: mintNFTParametersSchema,
      },
      // Implement the method
      (parameters: z.infer<typeof mintNFTParametersSchema>) =>
        mintNFTMethod(walletClient, parameters),
    );

    const upgradeTool = createTool(
      {
        name: "upgrade_nft",
        description: "Upgrades a NFT",
        parameters: upgradeNFTParametersSchema,
      },
      (parameters: z.infer<typeof upgradeNFTParametersSchema>) =>
        upgradeNFTMethod(walletClient, parameters),
    );

    const updateDescriptionTool = createTool(
      {
        name: "update_nft_description",
        description: "Updates description of NFT",
        parameters: updateDescriptionParametersSchema,
      },
      (parameters: z.infer<typeof updateDescriptionParametersSchema>) =>
        updateDescriptionMethod(walletClient, parameters),
    );

    const updateImageUrlTool = createTool(
      {
        name: "update_nft_image_url",
        description: "Updates imageUrl of NFT",
        parameters: updateImageUrlParametersSchema,
      },
      (parameters: z.infer<typeof updateImageUrlParametersSchema>) =>
        updateImageUrlMethod(walletClient, parameters),
    );

    const burnTool = createTool(
      {
        name: "burn_nft",
        description: "Burns a NFT",
        parameters: burnNFTParametersSchema,
      },
      (parameters: z.infer<typeof burnNFTParametersSchema>) =>
        burnNFTMethod(walletClient, parameters),
    );

    return [mintTool, upgradeTool, updateDescriptionTool, updateImageUrlTool, burnTool];
  }
}
