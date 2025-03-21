import { DCAPlugin } from '../src/plugins/types';
import { PluginFactory } from '../src/plugins/pluginFactory/pluginFactory';

// Function to dynamically test a plugin
const testPluginTransaction = async (pluginName: string, amount: number, fromAddress: string, toAddress: string) => {
  try {
    // Dynamically get the plugin from the PluginFactory
    const plugin: DCAPlugin = PluginFactory.getPlugin(pluginName);

    // Perform the transaction
    const txHash = await plugin.sendTransaction(amount, fromAddress, toAddress);

    console.log(`Transaction successful! Hash: ${txHash}`);
  } catch (error:any) {
    console.error('Transaction failed:', error.message);
  }
};

// Test by calling the function dynamically
const pluginName = process.env.BLOCKCHAIN_PLUGIN || 'injective'; 
testPluginTransaction(pluginName, 1, 'inj1g8lwgz26ej7crwt906wp6wsnwjteh2qk0h4n2n', 'inj1aayaah777pwaudtzlxkemytwchpy05dl03d4xt');
