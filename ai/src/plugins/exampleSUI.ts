import { Transaction } from '@mysten/sui/transactions';

// Assuming suiWalletClient is already initialized
const suiWalletClient = /* your initialized SuiWalletClient instance */;

// Example 1: Minting a new NFT
async function mintNFT() {
  const tx = new Transaction();
  
  // Get the sender address from the wallet
  const sender = suiWalletClient.getAddress();
  // Set sender explicitly for the transaction
  tx.setSender(sender);
  
  // Reference to the RealmCounter shared object
  const counterObjectId = '0x...'; // Replace with the actual RealmCounter object ID
  
  tx.moveCall({
    target: 'pawmise::pawmise::mint',
    arguments: [
      tx.object(counterObjectId), // The shared RealmCounter object
      tx.pure.string('Forest Realm'), // name
      tx.pure.string('A magical forest'), // description
      tx.pure.string('ipfs://forest.png'), // image_url
      tx.pure.address(sender), // creator address (using the wallet's address)
    ]
  });
  
  // Build the transaction
  await tx.build({ client: suiWalletClient.getClient() });
  
  // Send the transaction using the wallet client
  const result = await suiWalletClient.sendTransaction(tx);
  
  // Wait for transaction to be indexed
  await suiWalletClient.getClient().waitForTransaction({ digest: result.digest });
  
  return result;
}

// Example 2: Upgrading the tier of an NFT
async function upgradeTier(nftObjectId) {
  const tx = new Transaction();
  
  // Set sender explicitly
  tx.setSender(suiWalletClient.getAddress());
  
  tx.moveCall({
    target: 'pawmise::pawmise::upgrade_tier',
    arguments: [
      tx.object(nftObjectId) // The NFT to upgrade
    ]
  });
  
  // Build the transaction
  await tx.build({ client: suiWalletClient.getClient() });
  
  // Send the transaction using the wallet client
  const result = await suiWalletClient.sendTransaction(tx);
  
  await suiWalletClient.getClient().waitForTransaction({ digest: result.digest });
  
  return result;
}

// Example 3: Updating the description of an NFT
async function updateDescription(nftObjectId, newDescription) {
  const tx = new Transaction();
  
  // Set sender explicitly
  tx.setSender(suiWalletClient.getAddress());
  
  tx.moveCall({
    target: 'pawmise::pawmise::update_description',
    arguments: [
      tx.object(nftObjectId), // The NFT to update
      tx.pure.string(newDescription) // New description
    ]
  });
  
  // Build the transaction
  await tx.build({ client: suiWalletClient.getClient() });
  
  // Send the transaction using the wallet client
  const result = await suiWalletClient.sendTransaction(tx);
  
  await suiWalletClient.getClient().waitForTransaction({ digest: result.digest });
  
  return result;
}

async function updateImageUrl(nftObjectId, newImageUrl) {
  const tx = new Transaction();
  
  // Set sender explicitly
  tx.setSender(suiWalletClient.getAddress());
  
  tx.moveCall({
    target: 'pawmise::pawmise::update_image_url',
    arguments: [
      tx.object(nftObjectId), // The NFT to update
      tx.pure.string(newImageUrl) // New description
    ]
  });
  
  // Build the transaction
  await tx.build({ client: suiWalletClient.getClient() });
  
  // Send the transaction using the wallet client
  const result = await suiWalletClient.sendTransaction(tx);
  
  await suiWalletClient.getClient().waitForTransaction({ digest: result.digest });
  
  return result;
}

// Example 4: Burning an NFT
async function burnNFT(nftObjectId) {
  const tx = new Transaction();
  
  // Set sender explicitly
  tx.setSender(suiWalletClient.getAddress());
  
  tx.moveCall({
    target: 'pawmise::pawmise::burn',
    arguments: [
      tx.object(nftObjectId) // The NFT to burn
    ]
  });
  
  // Build the transaction
  await tx.build({ client: suiWalletClient.getClient() });
  
  // Send the transaction using the wallet client
  const result = await suiWalletClient.sendTransaction(tx);
  
  await suiWalletClient.getClient().waitForTransaction({ digest: result.digest });
  
  return result;
}
