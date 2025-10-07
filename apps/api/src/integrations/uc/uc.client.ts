import axios, { AxiosInstance, AxiosError } from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UCOAuthTokenResponse } from '../ports/';

export interface UCCredentials {
  clientId: string;
  clientSecret: string;
  domain: string;
}

type TokenState = { accessToken: string; expiresAt: number };
type UCParams = Record<string, string | number | boolean>;

function normalizeHost(input: string): string {
  return input.replace(/^https?:\/\//i, '').replace(/\/+$/g, '');
}

/**
 * Low-level HTTP client for Ultimate Central:
 *  - Handles OAuth client-credentials flow
 *  - Caches token until near-expiry
 *  - Retries once on 401 with a fresh token
 */
@Injectable()
export class UCClient {
  private readonly logger = new Logger(UCClient.name);
  private client: AxiosInstance | null = null;
  private tokenState: TokenState | null = null;
  private currentCredentials: UCCredentials | null = null;

  constructor(private readonly cfg: ConfigService) {
    // Client will be initialized when credentials are set
  }

  /**
   * Configure the client with stored OAuth credentials
   */
  setCredentials(credentials: UCCredentials) {
    this.currentCredentials = credentials;
    this.tokenState = null; // Reset token when credentials change

    this.client = axios.create({
      baseURL: `https://${normalizeHost(credentials.domain)}`,
      timeout: 15000,
    });
  }

  private get creds() {
    if (!this.currentCredentials) {
      throw new Error(
        'UC credentials not configured. Call setCredentials first.',
      );
    }
    return {
      id: this.currentCredentials.clientId,
      secret: this.currentCredentials.clientSecret,
    };
  }

  private ensureConfigured() {
    if (!this.client || !this.currentCredentials) {
      throw new Error('UC client not configured. Call setCredentials first.');
    }
  }

  private now() {
    return Math.floor(Date.now() / 1000);
  }

  /** Fetch or reuse OAuth token; cached until ~30s before expiry. */
  private async getAccessToken(): Promise<string> {
    this.ensureConfigured();

    if (this.tokenState && this.tokenState.expiresAt - this.now() > 30) {
      return this.tokenState.accessToken;
    }
    const { id, secret } = this.creds;
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: id,
      client_secret: secret,
    });

    const resp = await this.client!.post<UCOAuthTokenResponse>(
      '/api/oauth/server',
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    const access_token = resp.data.access_token;
    const expires_in = resp.data.expires_in ?? 3600;

    if (!access_token) {
      throw new Error('UC OAuth: missing access_token in response');
    }

    this.tokenState = {
      accessToken: access_token,
      expiresAt: this.now() + expires_in,
    };
    return access_token;
  }

  /** Run a UC request with Authorization header, retrying once on 401. */
  private async authed<T>(
    fn: (cli: AxiosInstance, auth: { Authorization: string }) => Promise<T>,
  ): Promise<T> {
    const token = await this.getAccessToken();
    const auth = { Authorization: `Bearer ${token}` };

    try {
      return await fn(this.client!, auth);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const e: AxiosError = err;
        if (e.response?.status === 401) {
          // Refresh once
          const t2 = await this.getAccessToken();
          return fn(this.client!, { Authorization: `Bearer ${t2}` });
        }
        this.logger.error(`UC request failed: ${e.message}`, e.stack);
        throw e;
      }
      this.logger.error(`Unknown error in UC client: ${String(err)}`);
      throw err;
    }
  }

  /** GET helper with typed response + UC params. */
  get<T>(url: string, params?: UCParams) {
    return this.authed(async (cli, auth) => {
      const { data } = await cli.get<T>(url, { params, headers: auth });
      return data;
    });
  }

  /** POST helper with typed response. */
  post<T>(url: string, body?: unknown) {
    return this.authed(async (cli, auth) => {
      const { data } = await cli.post<T>(url, body, { headers: auth });
      return data;
    });
  }
}
