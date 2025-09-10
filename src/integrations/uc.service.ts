import axios, { AxiosInstance, AxiosError } from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  UCEventsResponse,
  UCRegistrationsResponse,
  UCMeResponse,
  EventsQuery,
  toUcEventsParams,
} from './uc.types';

type TokenState = { accessToken: string; expiresAt: number };

function normalizeHost(input: string): string {
  return input.replace(/^https?:\/\//i, '').replace(/\/+$/g, '');
}

@Injectable()
export class UCService {
  private readonly logger = new Logger(UCService.name);
  private client!: AxiosInstance;
  private tokenState: TokenState | null = null;

  constructor(private readonly cfg: ConfigService) {
    const raw = this.cfg.get<string>('UC_API_DOMAIN', '');
    if (!raw) throw new Error('UC_API_DOMAIN is not set');
    const baseURL = `https://${normalizeHost(raw)}`;
    this.client = axios.create({ baseURL, timeout: 15000 });
  }

  private get creds() {
    const id = this.cfg.get<string>('UC_CLIENT_ID', '');
    const secret = this.cfg.get<string>('UC_CLIENT_SECRET', '');
    if (!id || !secret)
      throw new Error('UC_CLIENT_ID/UC_CLIENT_SECRET are not set');
    return { id, secret };
  }

  private now() {
    return Math.floor(Date.now() / 1000);
  }

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
    const { data } = await this.client.post<{
      access_token: string;
      expires_in?: number;
    }>('/api/oauth/server', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const { access_token, expires_in } = data as {
      access_token: string;
      expires_in?: number;
    };
    const ttl = typeof expires_in === 'number' ? expires_in : 3600;
    this.tokenState = {
      accessToken: access_token,
      expiresAt: this.now() + ttl,
    };
    return access_token;
  }

  private async getNewTokenSafe(): Promise<string> {
    try {
      return await this.getAccessToken();
    } catch (e) {
      this.logger.error(
        'UC token refresh failed',
        e instanceof Error ? e.stack : String(e),
      );
      throw e;
    }
  }

  private async authed<T>(
    fn: (
      cli: AxiosInstance,
      authHeader: { Authorization: string },
    ) => Promise<T>,
  ): Promise<T> {
    const token = await this.getAccessToken();
    const auth = { Authorization: `Bearer ${token}` };
    try {
      return await fn(this.client, auth);
    } catch (err) {
      const e = err as AxiosError;
      if (e.response?.status === 401) {
        const t2 = await this.getNewTokenSafe();
        return fn(this.client, { Authorization: `Bearer ${t2}` });
      }
      throw e;
    }
  }

  // ---- Public API ----

  async me(): Promise<UCMeResponse> {
    return this.authed(async (cli, auth) => {
      const { data } = await cli.get<UCMeResponse>('/api/me', {
        headers: auth,
      });
      return data;
    });
  }

  async listEvents(params?: EventsQuery): Promise<UCEventsResponse> {
    return this.authed(async (cli, auth) => {
      const qp = toUcEventsParams(params);
      const { data } = await cli.get<UCEventsResponse>('/api/events', {
        params: qp,
        headers: auth,
      });
      return data;
    });
  }

  async getEventById(
    id: number,
  ): Promise<UCEventsResponse['result'][number] | null> {
    const res = await this.listEvents({ id });
    return res.result?.[0] ?? null;
  }

  async listRegistrations(
    eventId: number,
    includePerson = true,
  ): Promise<UCRegistrationsResponse> {
    return this.authed(async (cli, auth) => {
      const params: Record<string, any> = { event_id: eventId };
      if (includePerson) params.fields = 'Person';
      const { data } = await cli.get<UCRegistrationsResponse>(
        '/api/registrations',
        {
          params,
          headers: auth,
        },
      );
      return data;
    });
  }
}
