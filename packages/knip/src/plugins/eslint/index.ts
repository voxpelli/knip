import { basename } from '#p/util/path.js';
import { hasDependency } from '#p/util/plugin.js';
import { getDependenciesDeep } from './helpers.js';
import type { IsPluginEnabled, ResolveFromPath } from '#p/types/plugins.js';

// Old: https://eslint.org/docs/latest/use/configure/configuration-files
// New: https://eslint.org/docs/latest/use/configure/configuration-files-new

// Note: shareable configs should use `peerDependencies` for plugins
// https://eslint.org/docs/latest/extend/shareable-configs#publishing-a-shareable-config

const title = 'ESLint';

const enablers = ['eslint'];

const isEnabled: IsPluginEnabled = ({ dependencies, manifest, config }) =>
  hasDependency(dependencies, enablers) ||
  'eslint' in config ||
  Boolean(manifest.name && /(^eslint-config|\/eslint-config)/.test(manifest.name));

export const packageJsonPath = 'eslintConfig';

const config = [
  'eslint.config.{js,cjs,mjs}',
  '.eslintrc',
  '.eslintrc.{js,json,cjs}',
  '.eslintrc.{yml,yaml}',
  'package.json',
];

const resolveFromPath: ResolveFromPath = async (configFilePath, { cwd, manifest, isProduction }) => {
  if (isProduction) return [];

  // The new configuration format does not need custom dependency resolving (it has only imports)
  const baseFilePath = basename(configFilePath);
  if (
    baseFilePath === 'eslint.config.js' ||
    baseFilePath === 'eslint.config.cjs' ||
    baseFilePath === 'eslint.config.mjs'
  )
    return [];

  const dependencies = await getDependenciesDeep(configFilePath, { cwd, manifest });
  return Array.from(dependencies);
};

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveFromPath,
} as const;
