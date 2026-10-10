// https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// La versión ESM del SDK de Anthropic tiene dependencias circulares que truenan en modo
// desarrollo (React Refresh lee sus exports antes de que se inicialicen) y la app no arranca
// en Expo Go. Para ese paquete se usa su versión CommonJS, que tolera los ciclos.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  if (moduleName === '@anthropic-ai/sdk' || moduleName.startsWith('@anthropic-ai/sdk/')) {
    return resolve({ ...context, isESMImport: false }, moduleName, platform);
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;
