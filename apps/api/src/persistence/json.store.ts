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
    const exists = (await pathExists(filePath)) as boolean;
    if (!exists) return [];
    return (await readJSON(filePath)) as T[];
  }

  async saveAll(rows: T[]): Promise<void> {
    (await ensureDir(join(process.cwd(), 'out'))) as Promise<void>;
    (await writeJSON(this.file(), rows, { spaces: 2 })) as Promise<void>;
  }
}
