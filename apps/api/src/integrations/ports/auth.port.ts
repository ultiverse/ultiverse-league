export interface UCOAuthTokenResponse {
  access_token: string;
  expires_in?: number;
  token_type?: 'Bearer';
  scope?: string | null;
}
