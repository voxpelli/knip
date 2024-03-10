import { getGitHookPaths } from '#p/util/git.js';
import { getDependenciesFromScripts, hasDependency, loadFile } from '#p/util/plugin.js';
import semver from 'semver';
import type { IsPluginEnabled, ResolveFromPath } from '#p/types/plugins.js';

// https://typicode.github.io/husky

const title = 'husky';

const enablers = ['husky'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const gitHooksPathInV8 = getGitHookPaths('.husky', true);
// husky v9 registers hooks in .husky/_/ to git and calls user defined hooks in .husky/ from there
const gitHookPathsInV9 = getGitHookPaths('.husky', false);

// Add patterns for both v8 and v9 because we can't know which version is installed at this point
const config = [...gitHooksPathInV8, ...gitHookPathsInV9];

const resolveFromPath: ResolveFromPath = async (configFilePath, options) => {
  const { isProduction, manifest } = options;

  if (isProduction) return [];

  const huskyVersion = manifest.devDependencies?.husky ?? manifest.dependencies?.husky ?? '*';

  // Ignore config files that are not used by the installed husky version
  const isV8OrLower = semver.intersects(huskyVersion, '<9', {
    includePrerelease: true,
  });
  if (!isV8OrLower && gitHooksPathInV8.some(path => configFilePath.includes(path))) {
    return [];
  }

  const isV9OrHigher = semver.intersects(huskyVersion, '>=9', {
    includePrerelease: true,
  });
  if (!isV9OrHigher && gitHookPathsInV9.some(path => configFilePath.includes(path))) {
    return [];
  }

  const script = await loadFile(configFilePath);

  if (!script) return [];

  return getDependenciesFromScripts(String(script), { ...options, knownGlobalsOnly: true });
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveFromPath,
};
