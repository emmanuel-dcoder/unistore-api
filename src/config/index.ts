export class ConfigService {
  constructor(private env: { [k: string]: string | undefined }) {}

  protected getValue(key: string, throwOnMissing = true): string {
    const value = this.env[key];
    if (!value && throwOnMissing) {
      throw new Error(`config error - missing env.${key}`);
    }

    return value;
  }

  public ensureValues(keys: string[]) {
    keys.forEach((k) => this.getValue(k, true));
    return this;
  }

  public getPort() {
    return this.getValue('PORT', true);
  }

  public isProduction() {
    const mode = this.getValue('NODE_ENV', false);
    return mode === 'production';
  }

  public config() {
    return {
      port: parseInt(this.getPort(), 10) || 8080,
      database: {},
      keys: {
        REFRESH_KEY: this.getValue('REFRESH_TOKEN_KEY') as string,
        ACCESS_KEY: this.getValue('SECRET_KEY') as string,
      },

      eventConfig: {
        // set this to `true` to use wildcards
        wildcard: false,
        // the delimiter used to segment namespaces
        delimiter: '.',
        // set this to `true` if you want to emit the newListener event
        newListener: false,
        // set this to `true` if you want to emit the removeListener event
        removeListener: false,
        // the maximum amount of listeners that can be assigned to an event
        maxListeners: 10,
        // show event name in memory leak message when more than maximum amount of listeners is assigned
        verboseMemoryLeak: false,
        // disable throwing uncaughtException if an error event is emitted and it has no listeners
        ignoreErrors: false,
      },
    };
  }
}
export const AccessToken = 'access-token';
export const RefreshToken = 'refresh-token';

export const AccessTokenMaxAge = 60 * 60 * 24 * 14 * 1000; // 2 weeks in milliseconds
export const RefreshTokenMaxAge = 60 * 60 * 24 * 90 * 1000; // 3 months in milliseconds

export default new ConfigService(process.env);
export * from './allowed-origins';
export * from './db';
export * from './keys';
