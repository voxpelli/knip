import type { EnsuredPluginConfiguration, IgnorePatterns, WorkspaceConfiguration } from './config.js';
import type { PackageJson } from './package-json.js';
import type { DependencySet } from './workspace.js';

export interface BaseOptions {
  cwd: string;
  manifestScriptNames: Set<string>;
  dependencies: DependencySet;
}

type IsPluginEnabledOptions = {
  cwd: string;
  manifest: PackageJson;
  dependencies: Set<string>;
  config: WorkspaceConfiguration;
};

export type IsPluginEnabled = (options: IsPluginEnabledOptions) => boolean | Promise<boolean>;

export interface PluginOptions extends BaseOptions {
  manifest: PackageJson;
  config: EnsuredPluginConfiguration;
  configFileDir: string;
  configFileName: string;
  isProduction: boolean;
  enabledPlugins: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ResolveEntryPaths<T = any> = (config: T, options: PluginOptions) => Promise<string[]> | string[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ResolveConfig<T = any> = (config: T, options: PluginOptions) => Promise<string[]> | string[];

export type ResolveFromPath = (configFilePath: string, options: PluginOptions) => Promise<string[]> | string[];

export type Resolve = (options: PluginOptions) => Promise<string[]> | string[];

export interface Plugin {
  title: string;
  enablers: IgnorePatterns | string;
  packageJsonPath?: string;
  isEnabled: IsPluginEnabled;
  config?: string[];
  entry?: string[];
  production?: string[];
  project?: string[];
  resolveEntryPaths?: ResolveEntryPaths;
  resolveConfig?: ResolveConfig;
  resolveFromPath?: ResolveFromPath;
  resolve?: Resolve;
}
