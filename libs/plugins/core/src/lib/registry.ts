import { LegislaturePlugin } from './plugin.interface';

/**
 * Global static registry for State Legislature API plugins.
 * Enables host applications to register and query plugin implementations by state/jurisdiction ID.
 */
export class LegislaturePluginRegistry {
  private static plugins = new Map<string, LegislaturePlugin>();

  /**
   * Register a legislature plugin instance.
   */
  static register(plugin: LegislaturePlugin): void {
    if (!plugin || !plugin.id) {
      throw new Error('Invalid legislature plugin instance');
    }
    this.plugins.set(plugin.id.toLowerCase(), plugin);
  }

  /**
   * Retrieve a registered legislature plugin by state/jurisdiction ID.
   */
  static get(id: string): LegislaturePlugin | undefined {
    return this.plugins.get(id.toLowerCase());
  }

  /**
   * Check if a plugin is registered for a given jurisdiction ID.
   */
  static has(id: string): boolean {
    return this.plugins.has(id.toLowerCase());
  }

  /**
   * Return all registered legislature plugins.
   */
  static getAll(): LegislaturePlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Unregister a plugin by jurisdiction ID (useful in test teardown).
   */
  static unregister(id: string): boolean {
    return this.plugins.delete(id.toLowerCase());
  }

  /**
   * Clear all registered plugins.
   */
  static clear(): void {
    this.plugins.clear();
  }
}
