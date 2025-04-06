import { DCAPlugin } from '../../../types';
import { InjectivePlugin } from './injective.chains';
import { AptosPlugin } from './aptos.chains';
import { SonicPlugin } from './sonic.chains';
import { logger } from '../../../../utils/logger';

export class PluginFactory {
  private static plugins: Map<string, () => DCAPlugin> = new Map();

  // Register available plugins
  static registerPlugin(name: string, plugin: () => DCAPlugin) {
    logger.info(`Registering plugin: ${name}`);
    this.plugins.set(name, plugin);
  }

  static getPlugin(pluginName: string): DCAPlugin {
    logger.info(`Getting plugin for chain: ${pluginName}`);
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }
    return plugin();
  }

  static initializePlugins() {
    logger.info('Initializing DCA plugins');
    // Register all available plugins
    PluginFactory.registerPlugin('injective', () => new InjectivePlugin());
    PluginFactory.registerPlugin('aptos', () => new AptosPlugin());
    PluginFactory.registerPlugin('sonic', () => new SonicPlugin());
    logger.info('DCA plugins initialized successfully');
  }
}
