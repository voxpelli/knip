import { join } from '#p/util/path.js';
import { hasDependency } from '#p/util/plugin.js';
import { resolveFromPath as tsResolveFromPath } from '../typescript/index.js';
import type { IsPluginEnabled, ResolveConfig } from '#p/types/plugins.js';
import type { AngularCLIWorkspaceConfiguration } from './types.js';

// https://angular.io/guide/workspace-config

const title = 'Angular';

const enablers = ['@angular/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['angular.json'];

const resolveConfig: ResolveConfig<AngularCLIWorkspaceConfiguration> = async (config, options) => {
  const { cwd } = options;

  if (!config?.projects) return [];

  const dependencies = new Set<string>();

  for (const project of Object.values(config.projects)) {
    if (!project.architect) return [];
    for (const target of Object.values(project.architect)) {
      const { options: opts } = target;
      const [packageName] = typeof target.builder === 'string' ? target.builder.split(':') : [];
      if (typeof packageName === 'string') dependencies.add(packageName);
      if (opts) {
        if ('main' in opts && typeof opts.main === 'string') {
          dependencies.add(join(cwd, opts.main));
        }
        if ('tsConfig' in opts && typeof opts.tsConfig === 'string') {
          const tsConfigDependencies = await tsResolveFromPath(join(cwd, opts.tsConfig), options);
          tsConfigDependencies.forEach(dependency => dependencies.add(dependency));
        }
      }
    }
  }

  return Array.from(dependencies);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} as const;
