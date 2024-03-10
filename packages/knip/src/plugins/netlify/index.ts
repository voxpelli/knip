import { join } from '#p/util/path.js';
import { hasDependency } from '#p/util/plugin.js';
import { extractFunctionsConfigProperty } from './helpers.js';
import type { IsPluginEnabled, ResolveConfig, ResolveEntryPaths } from '#p/types/plugins.js';
import type { NetlifyConfig } from './types.js';

// https://docs.netlify.com
// https://docs.netlify.com/functions/get-started/

const title = 'Netlify';

const enablers = [/^@netlify\/plugin-/, 'netlify-cli', '@netlify/functions'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['netlify.toml'];

const NETLIFY_FUNCTIONS_DIR = 'netlify/functions';
const NETLIFY_FUNCTIONS_EXTS = 'js,mjs,cjs,ts,mts,cts';

const production: string[] = [`${NETLIFY_FUNCTIONS_DIR}/**/*.{${NETLIFY_FUNCTIONS_EXTS}}`];

const resolveEntryPaths: ResolveEntryPaths<NetlifyConfig> = localConfig => {
  return [
    ...extractFunctionsConfigProperty(localConfig.functions || {}, 'included_files'),
    join(localConfig.functions?.directory ?? NETLIFY_FUNCTIONS_DIR, `**/*.{${NETLIFY_FUNCTIONS_EXTS}}`),
  ].filter(file => !file.startsWith('!'));
};

const resolveConfig: ResolveConfig<NetlifyConfig> = async localConfig => {
  return [
    ...(localConfig?.plugins?.map(plugin => plugin.package) ?? []),
    ...extractFunctionsConfigProperty(localConfig.functions || {}, 'external_node_modules'),
  ];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveEntryPaths,
  resolveConfig,
};
