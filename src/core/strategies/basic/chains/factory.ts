import { DCAPlugin } from '../../../types';
import { InjectivePlugin } from './injective';
import { AptosPlugin } from './aptos';
import { SonicPlugin } from './sonic';

export class PluginFactory {
  private static plugins: Map<string, () => DCAPlugin> = new Map();

  // Register available plugins
  static registerPlugin(name: string, plugin: () => DCAPlugin) {
    this.plugins.set(name, plugin);
  }

  static getPlugin(pluginName: string): DCAPlugin {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }
    return plugin();
  }
}

// Register plugins dynamically
PluginFactory.registerPlugin('injective', () => new InjectivePlugin());
PluginFactory.registerPlugin('aptos', () => new AptosPlugin());
PluginFactory.registerPlugin('sonic', () => new SonicPlugin());
