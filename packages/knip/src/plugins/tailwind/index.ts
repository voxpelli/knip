import { hasDependency } from '#p/util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { IsPluginEnabled, ResolveConfig } from '#p/types/plugins.js';

// https://tailwindcss.com/docs/configuration

const title = 'Tailwind';

const enablers = ['tailwindcss'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['tailwind.config.{js,cjs,mjs,ts}'];

const findDependencies: ResolveConfig = async (configFilePath, options) => {
  const { config } = options;
  return config.entry ? config.entry.map(toEntryPattern) : entry.map(toEntryPattern);
};

export default {
  title,
  enablers,
  isEnabled,
  entry,
  findDependencies,
};
