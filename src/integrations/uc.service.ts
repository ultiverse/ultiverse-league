import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class UCService {
  async me(apiDomain: string, token: string) {
    // return (await axios.get(`https://${apiDomain}/api/me`, { headers: { Authorization: `Bearer ${token}` }})).data;
    return { id: 123, name: 'UC Demo (mock)' };
  }
}
