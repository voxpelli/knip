import { dirname, join, relative } from '#p/util/path.js';
import { hasDependency, load } from '#p/util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { IsPluginEnabled, ResolveFromPath } from '#p/types/plugins.js';
import type { StorybookConfig } from './types.js';

// https://storybook.js.org/docs/react/configure/overview

const title = 'Storybook';

const enablers = [/^@storybook\//, '@nrwl/storybook'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.storybook/{main,test-runner}.{js,ts}'];

const stories = ['**/*.@(mdx|stories.@(mdx|js|jsx|mjs|ts|tsx))'];

const restEntry = ['.storybook/{manager,preview}.{js,jsx,ts,tsx}'];

const entry = [...restEntry, ...stories];

const project = ['.storybook/**/*.{js,jsx,ts,tsx}'];

const resolveFromPath: ResolveFromPath = async (configFilePath, options) => {
  const { isProduction, cwd, config } = options;

  const localConfig: StorybookConfig | undefined = await load(configFilePath);

  const strs = typeof localConfig?.stories === 'function' ? await localConfig.stories(stories) : localConfig?.stories;
  const relativePatterns = strs?.map(pattern => {
    if (typeof pattern === 'string') return relative(cwd, join(dirname(configFilePath), pattern));
    return relative(cwd, join(dirname(configFilePath), pattern.directory, pattern.files ?? stories[0]));
  });
  const patterns = [
    ...(config?.entry ?? restEntry),
    ...(relativePatterns && relativePatterns.length > 0 ? relativePatterns : stories),
  ];
  const entryPatterns = patterns.map(toEntryPattern);

  if (!localConfig || isProduction) return entryPatterns;
  const addons = localConfig.addons?.map(addon => (typeof addon === 'string' ? addon : addon.name)) ?? [];
  const builder = localConfig?.core?.builder;
  const builderPackages =
    builder && /webpack/.test(builder) ? [`@storybook/builder-${builder}`, `@storybook/manager-${builder}`] : [];
  const frameworks = localConfig.framework?.name ? [localConfig.framework.name] : [];

  return [...entryPatterns, ...addons, ...builderPackages, ...frameworks];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  project,
  resolveFromPath,
} as const;
