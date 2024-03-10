import { basename, join, isInternal, toAbsolute, dirname } from '#p/util/path.js';
import { hasDependency, load } from '#p/util/plugin.js';
import { toEntryPattern } from '#p/util/protocols.js';
import type { IsPluginEnabled, ResolveFromPath, PluginOptions } from '#p/types/plugins.js';
import type { JestConfig, JestInitialOptions } from './types.js';

// https://jestjs.io/docs/configuration

const title = 'Jest';

const enablers = ['jest'];

const isEnabled: IsPluginEnabled = ({ dependencies, manifest }) =>
  hasDependency(dependencies, enablers) || Boolean(manifest.name?.startsWith('jest-presets'));

const config = ['jest.config.{js,ts,mjs,cjs,json}', 'package.json'];

const entry = ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'];

const resolveExtensibleConfig = async (configFilePath: string) => {
  const config = await load(configFilePath);
  if (config?.preset) {
    const { preset } = config;
    if (isInternal(preset)) {
      const presetConfigPath = toAbsolute(preset, dirname(configFilePath));
      const presetConfig = await resolveExtensibleConfig(presetConfigPath);
      Object.assign(config, presetConfig);
    }
  }
  return config;
};

const resolveDependencies = (config: JestInitialOptions, options: PluginOptions): string[] => {
  const { isProduction } = options;

  const entryPatterns = (options.config?.entry ?? config.testMatch ?? entry).map(toEntryPattern);

  if (isProduction) return entryPatterns;

  const presets = (config.preset ? [config.preset] : []).map(preset =>
    isInternal(preset) ? preset : join(preset, 'jest-preset')
  );
  const projects = Array.isArray(config.projects)
    ? config.projects.map(config => (typeof config === 'string' ? config : resolveDependencies(config, options))).flat()
    : [];
  const runner = config.runner ? [config.runner] : [];
  const environments = config.testEnvironment === 'jsdom' ? ['jest-environment-jsdom'] : [];
  const resolvers = config.resolver ? [config.resolver] : [];
  const reporters = config.reporters
    ? config.reporters
        .map(reporter => (typeof reporter === 'string' ? reporter : reporter[0]))
        .filter(reporter => !['default', 'github-actions', 'summary'].includes(reporter))
    : [];
  const watchPlugins =
    config.watchPlugins?.map(watchPlugin => (typeof watchPlugin === 'string' ? watchPlugin : watchPlugin[0])) ?? [];
  const setupFiles = config.setupFiles ?? [];
  const setupFilesAfterEnv = config.setupFilesAfterEnv ?? [];
  const transform = config.transform
    ? Object.values(config.transform).map(transform => (typeof transform === 'string' ? transform : transform[0]))
    : [];
  const moduleNameMapper = (
    config.moduleNameMapper
      ? Object.values(config.moduleNameMapper).map(mapper => (typeof mapper === 'string' ? mapper : mapper[0]))
      : []
  ).filter(value => !/\$[0-9]/.test(value));
  const testResultsProcessor = config.testResultsProcessor ? [config.testResultsProcessor] : [];
  const snapshotResolver = config.snapshotResolver ? [config.snapshotResolver] : [];

  return [
    ...entryPatterns,
    ...presets,
    ...projects,
    ...runner,
    ...environments,
    ...resolvers,
    ...reporters,
    ...watchPlugins,
    ...setupFiles,
    ...setupFilesAfterEnv,
    ...transform,
    ...moduleNameMapper,
    ...testResultsProcessor,
    ...snapshotResolver,
  ];
};

const resolveFromPath: ResolveFromPath = async (configFilePath, options) => {
  const { manifest, cwd } = options;

  let localConfig: JestConfig | undefined =
    basename(configFilePath) === 'package.json' ? manifest.jest : await resolveExtensibleConfig(configFilePath);

  if (typeof localConfig === 'function') localConfig = await localConfig();

  // Normally we should bail out here, but to avoid duplication and keep it easy we carry on with fake local config
  if (!localConfig) localConfig = {};

  const rootDir = localConfig.rootDir ? join(dirname(configFilePath), localConfig.rootDir) : dirname(configFilePath);

  const replaceRootDir = (name: string) => (name.includes('<rootDir>') ? name.replace(/<rootDir>/, rootDir) : name);

  const dependencies = resolveDependencies(localConfig, options);

  const matchCwd = new RegExp('^' + toEntryPattern(cwd) + '/');
  return dependencies.map(replaceRootDir).map(dependency => dependency.replace(matchCwd, toEntryPattern('')));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveFromPath,
};
