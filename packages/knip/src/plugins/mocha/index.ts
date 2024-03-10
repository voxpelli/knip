import { hasDependency } from '#p/util/plugin.js';
import { toEntryPattern } from '#p/util/protocols.js';
import type { ResolveConfig, IsPluginEnabled } from '#p/types/plugins.js';
import type { MochaConfig } from './types.js';

// https://mochajs.org/#configuring-mocha-nodejs

const title = 'Mocha';

const enablers = ['mocha'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.mocharc.{js,cjs,json,jsonc,yml,yaml}', 'package.json'];

const entry = ['**/test/*.{js,cjs,mjs}'];

const resolveConfig: ResolveConfig<MochaConfig> = (localConfig, options) => {
  const { config, isProduction } = options;

  const entryPatterns = (config.entry ?? (localConfig?.spec ? [localConfig.spec].flat() : entry)).map(toEntryPattern);

  if (isProduction || !localConfig) return entryPatterns;

  const require = localConfig.require ? [localConfig.require].flat() : [];

  return [...require, ...entryPatterns];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
} as const;
