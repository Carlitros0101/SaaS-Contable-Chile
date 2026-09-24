export type AuthUrlConfig = {
  baseURL: string;
  trustedOrigins: string[];
};

export function buildAuthUrlConfig(config: {
  configuredUrl?: string;
  deployUrl?: string;
  canonicalUrl?: string;
}): AuthUrlConfig {
  const origins = [config.configuredUrl, config.canonicalUrl, config.deployUrl]
    .filter((value): value is string => Boolean(value));
  return {
    baseURL: config.deployUrl ?? config.configuredUrl ?? "http://localhost:3000",
    trustedOrigins: [...new Set(origins)],
  };
}
