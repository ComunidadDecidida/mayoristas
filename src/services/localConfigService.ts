export interface LocalConfig {
  app: {
    name: string;
    version: string;
    mode: 'development' | 'production';
  };
  database: {
    enabled: boolean;
    mode: 'direct' | 'edge_function';
    connection: {
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
    };
    edgeFunction: {
      enabled: boolean;
      functionName: string;
    };
  };
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  offline: {
    enabled: boolean;
    syncInterval: number;
  };
  apis: {
    syscom: {
      enabled: boolean;
      client_id: string;
      client_secret: string;
      base_url: string;
    };
    tecnosinergia: {
      enabled: boolean;
      api_token: string;
      base_url: string;
    };
  };
  payment: {
    mercadopago: {
      enabled: boolean;
      mode: 'test' | 'production';
    };
    stripe: {
      enabled: boolean;
      mode: 'test' | 'production';
    };
    paypal: {
      enabled: boolean;
      mode: 'sandbox' | 'production';
    };
  };
  notifications: {
    whatsapp: {
      enabled: boolean;
    };
    telegram: {
      enabled: boolean;
    };
  };
  exchangeRate: {
    USD: number;
    MXN: number;
  };
  markup: {
    default: number;
  };
}

class LocalConfigService {
  private config: LocalConfig | null = null;
  private readonly CONFIG_KEY = 'app_local_config';
  private readonly CONFIG_URL = '/config.json';

  async loadConfig(): Promise<LocalConfig> {
    if (this.config) {
      return this.config;
    }

    const localConfig = this.getFromLocalStorage();
    if (localConfig) {
      this.config = localConfig;
      return localConfig;
    }

    try {
      const response = await fetch(this.CONFIG_URL);
      if (response.ok) {
        const config = await response.json();
        this.config = config;
        return config;
      }
    } catch (error) {
      console.warn('Error loading config from file:', error);
    }

    return this.getDefaultConfig();
  }

  getConfig(): LocalConfig | null {
    return this.config;
  }

  updateConfig(updates: Partial<LocalConfig>): void {
    if (!this.config) {
      this.config = this.getDefaultConfig();
    }

    this.config = this.deepMerge(this.config, updates);
    this.saveToLocalStorage();
  }

  saveToLocalStorage(): void {
    if (this.config) {
      try {
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.config));
      } catch (error) {
        console.error('Error saving config to localStorage:', error);
      }
    }
  }

  private getFromLocalStorage(): LocalConfig | null {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading config from localStorage:', error);
    }
    return null;
  }

  private getDefaultConfig(): LocalConfig {
    return {
      app: {
        name: 'Mayorista de Sistemas',
        version: '1.0.0',
        mode: 'production',
      },
      database: {
        enabled: false,
        mode: 'edge_function',
        connection: {
          host: '',
          port: 3306,
          database: '',
          user: '',
          password: '',
        },
        edgeFunction: {
          enabled: true,
          functionName: 'mysql_bd_mayorista',
        },
      },
      cache: {
        enabled: true,
        ttl: 3600000,
        maxSize: 100,
      },
      offline: {
        enabled: true,
        syncInterval: 300000,
      },
      apis: {
        syscom: {
          enabled: false,
          client_id: '',
          client_secret: '',
          base_url: 'https://developers.syscom.mx/api/v1',
        },
        tecnosinergia: {
          enabled: false,
          api_token: '',
          base_url: 'https://api.tecnosinergia.info/v3',
        },
      },
      payment: {
        mercadopago: {
          enabled: false,
          mode: 'test',
        },
        stripe: {
          enabled: false,
          mode: 'test',
        },
        paypal: {
          enabled: false,
          mode: 'sandbox',
        },
      },
      notifications: {
        whatsapp: {
          enabled: false,
        },
        telegram: {
          enabled: false,
        },
      },
      exchangeRate: {
        USD: 17.5,
        MXN: 1,
      },
      markup: {
        default: 20,
      },
    };
  }

  private deepMerge(target: any, source: any): any {
    const output = { ...target };

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }

    return output;
  }

  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  isDatabaseConnected(): boolean {
    return this.config?.database?.enabled || false;
  }

  getDatabaseMode(): 'direct' | 'edge_function' {
    return this.config?.database?.mode || 'edge_function';
  }

  isOfflineMode(): boolean {
    return !this.isDatabaseConnected() && this.config?.offline?.enabled !== false;
  }
}

export const localConfigService = new LocalConfigService();
