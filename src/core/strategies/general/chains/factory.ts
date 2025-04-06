import { DCAPlugin } from '../../../types';
import { TonPlugin } from './ton';
import { InjectivePlugin } from './injective';
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
PluginFactory.registerPlugin('ton', () => new TonPlugin());
PluginFactory.registerPlugin('injective', () => new InjectivePlugin());
PluginFactory.registerPlugin('sonic', () => new SonicPlugin());


