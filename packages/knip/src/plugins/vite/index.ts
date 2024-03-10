import { hasDependency, load } from '#p/util/plugin.js';
import { findVitestDependencies } from '../vitest/index.js';
import type { IsPluginEnabled, ResolveFromPath } from '#p/types/plugins.js';
import type { ViteConfigOrFn } from '../vitest/types.js';

// https://vitejs.dev/config/

const title = 'Vite';

const enablers = ['vite'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

export const config = ['vite*.config.{js,mjs,ts,cjs,mts,cts}'];

const resolveFromPath: ResolveFromPath = async (configFilePath, options) => {
  const localConfig: ViteConfigOrFn | undefined = await load(configFilePath);

  if (!localConfig) return [];

  return findVitestDependencies(configFilePath, localConfig, options);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveFromPath,
};
