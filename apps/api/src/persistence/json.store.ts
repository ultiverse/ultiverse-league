import { Injectable } from '@nestjs/common';
import { ensureDir, pathExists, readJSON, writeJSON } from 'fs-extra';
import { join } from 'node:path';

@Injectable()
export class JsonStore<T extends { id: string }> {
  constructor(private filename: string) {}

  private file() {
    return join(process.cwd(), 'out', this.filename);
  }

  async all(): Promise<T[]> {
    const filePath = this.file();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const exists = await pathExists(filePath);
    if (!exists) return [];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const data = await readJSON(filePath);
    return data as T[];
  }

  async saveAll(rows: T[]): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await ensureDir(join(process.cwd(), 'out'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await writeJSON(this.file(), rows, { spaces: 2 });
  }
}
