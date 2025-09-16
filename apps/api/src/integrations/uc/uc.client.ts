import axios, { AxiosInstance, AxiosError } from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UCOAuthTokenResponse } from '../ports/';

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
  private client!: AxiosInstance;
  private tokenState: TokenState | null = null;

  constructor(private readonly cfg: ConfigService) {
    const raw = this.cfg.get<string>('UC_API_DOMAIN', '');
    if (!raw) throw new Error('UC_API_DOMAIN is not set');

    this.client = axios.create({
      baseURL: `https://${normalizeHost(raw)}`,
      timeout: 15000,
    });
  }

  private get creds() {
    const id = this.cfg.get<string>('UC_CLIENT_ID', '');
    const secret = this.cfg.get<string>('UC_CLIENT_SECRET', '');
    if (!id || !secret) {
      throw new Error('UC_CLIENT_ID/UC_CLIENT_SECRET are not set');
    }
    return { id, secret };
  }

  private now() {
    return Math.floor(Date.now() / 1000);
  }

  /** Fetch or reuse OAuth token; cached until ~30s before expiry. */
  private async getAccessToken(): Promise<string> {
    if (this.tokenState && this.tokenState.expiresAt - this.now() > 30) {
      return this.tokenState.accessToken;
    }
    const { id, secret } = this.creds;
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: id,
      client_secret: secret,
    });

    const resp = await this.client.post<UCOAuthTokenResponse>(
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
      return await fn(this.client, auth);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const e: AxiosError = err;
        if (e.response?.status === 401) {
          // Refresh once
          const t2 = await this.getAccessToken();
          return fn(this.client, { Authorization: `Bearer ${t2}` });
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
