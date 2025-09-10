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
    const exists: boolean = await pathExists(filePath);
    if (!exists) return [];
    return readJSON(filePath);
  }

  async saveAll(rows: T[]) {
    await ensureDir(join(process.cwd(), 'out'));
    await writeJSON(this.file(), rows, { spaces: 2 });
  }
}
