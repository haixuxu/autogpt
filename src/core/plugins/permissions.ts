import type { PluginManifest } from './index';

export type Permission =
  | 'filesystem_read'
  | 'filesystem_write'
  | 'network_access'
  | 'code_execution'
  | 'plugin_install';

export interface PermissionRequest {
  plugin: string;
  permission: Permission;
  reason?: string;
}

export class PluginPermissionManager {
  private granted: Map<string, Set<Permission>> = new Map();
  private denied: Map<string, Set<Permission>> = new Map();

  constructor(private autoApprove: boolean = false) {}

  async requestPermission(
    manifest: PluginManifest,
    permission: Permission
  ): Promise<boolean> {
    const pluginName = manifest.name;

    // Check if already granted
    if (this.isGranted(pluginName, permission)) {
      return true;
    }

    // Check if already denied
    if (this.isDenied(pluginName, permission)) {
      return false;
    }

    // Auto-approve if enabled (for development/testing)
    if (this.autoApprove) {
      this.grant(pluginName, permission);
      return true;
    }

    // In production, would show UI prompt
    // For now, deny by default
    this.deny(pluginName, permission);
    return false;
  }

  grant(pluginName: string, permission: Permission): void {
    if (!this.granted.has(pluginName)) {
      this.granted.set(pluginName, new Set());
    }
    this.granted.get(pluginName)!.add(permission);

    // Remove from denied if present
    if (this.denied.has(pluginName)) {
      this.denied.get(pluginName)!.delete(permission);
    }
  }

  deny(pluginName: string, permission: Permission): void {
    if (!this.denied.has(pluginName)) {
      this.denied.set(pluginName, new Set());
    }
    this.denied.get(pluginName)!.add(permission);

    // Remove from granted if present
    if (this.granted.has(pluginName)) {
      this.granted.get(pluginName)!.delete(permission);
    }
  }

  isGranted(pluginName: string, permission: Permission): boolean {
    return this.granted.get(pluginName)?.has(permission) || false;
  }

  isDenied(pluginName: string, permission: Permission): boolean {
    return this.denied.get(pluginName)?.has(permission) || false;
  }

  checkPermission(pluginName: string, permission: Permission): boolean {
    if (this.isDenied(pluginName, permission)) {
      throw new Error(
        `Plugin ${pluginName} does not have permission: ${permission}`
      );
    }
    return this.isGranted(pluginName, permission);
  }

  revokeAll(pluginName: string): void {
    this.granted.delete(pluginName);
    this.denied.delete(pluginName);
  }
}

