import { compact } from '#p/util/array.js';
import { dirname, isInternal, toAbsolute } from '#p/util/path.js';
import { hasDependency, loadJSON } from '#p/util/plugin.js';
import { loadTSConfig } from '#p/util/tsconfig-loader.js';
import type { IsPluginEnabled, ResolveFromPath } from '#p/types/plugins.js';
import type { TsConfigJson } from 'type-fest';

// https://www.typescriptlang.org/tsconfig

const title = 'TypeScript';

const enablers = ['typescript'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['tsconfig.json', 'tsconfig.*.json'];

const resolveExtensibleConfig = async (configFilePath: string) => {
  const filePath = configFilePath.replace(/(\.json)?$/, '.json');
  const localConfig: TsConfigJson | undefined = await loadJSON(filePath);

  if (!localConfig) return;

  localConfig.extends = localConfig.extends ? [localConfig.extends].flat() : [];
  if (localConfig?.extends) {
    for (const extend of [localConfig.extends].flat()) {
      if (isInternal(extend)) {
        const presetConfigPath = toAbsolute(extend, dirname(configFilePath));
        const presetConfig = await resolveExtensibleConfig(presetConfigPath);
        localConfig.extends.push(...(presetConfig?.extends ? [presetConfig.extends].flat() : []));
      }
    }
  }
  return localConfig;
};

export const resolveFromPath: ResolveFromPath = async (configFilePath, options) => {
  const { isProduction } = options;

  const { compilerOptions } = await loadTSConfig(configFilePath);
  const localConfig: TsConfigJson | undefined = await resolveExtensibleConfig(configFilePath); // Dual loader to get external `extends` dependencies

  if (!compilerOptions || !localConfig) return [];

  const jsx = compilerOptions?.jsxImportSource ? [compilerOptions.jsxImportSource] : [];

  if (isProduction) return [...jsx];

  const extend = localConfig.extends ? [localConfig.extends].flat().filter(extend => !isInternal(extend)) : [];
  const types = compilerOptions.types ?? [];
  const plugins = Array.isArray(compilerOptions?.plugins)
    ? compilerOptions.plugins.map(plugin => (typeof plugin === 'object' && 'name' in plugin ? plugin.name : ''))
    : [];
  const importHelpers = compilerOptions?.importHelpers ? ['tslib'] : [];

  return compact([...extend, ...types, ...plugins, ...importHelpers, ...jsx]);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveFromPath,
};
