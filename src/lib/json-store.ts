import fs from 'node:fs/promises';
import path from 'node:path';

export type JsonRecord = Record<string, unknown> & { id: string };

export type JsonCollection<T extends JsonRecord> = {
  _meta: {
    version: number;
    lastModified: string;
    description: string;
  };
  records: T[];
};

const DATA_DIR = path.join(process.cwd(), 'data');

function filePath(collectionName: string) {
  return path.join(DATA_DIR, `${collectionName}.json`);
}

export async function readCollection<T extends JsonRecord>(collectionName: string) {
  const target = filePath(collectionName);
  const raw = await fs.readFile(target, 'utf-8');
  const parsed = JSON.parse(raw) as JsonCollection<T>;

  return parsed;
}

export async function writeCollection<T extends JsonRecord>(
  collectionName: string,
  collection: JsonCollection<T>,
) {
  const target = filePath(collectionName);
  const payload = JSON.stringify(collection, null, 2);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(target, payload, 'utf-8');
}

export async function createRecord<T extends JsonRecord>(
  collectionName: string,
  record: T,
  description = 'Colección generada por JSON Store',
) {
  const existing = await readCollection<T>(collectionName).catch(() => ({
    _meta: {
      version: 1,
      lastModified: new Date().toISOString(),
      description,
    },
    records: [] as T[],
  }));

  const next: JsonCollection<T> = {
    ...existing,
    _meta: {
      version: existing._meta?.version ? existing._meta.version + 1 : 1,
      lastModified: new Date().toISOString(),
      description: existing._meta?.description ?? description,
    },
    records: [...(existing.records ?? []), record],
  };

  await writeCollection(collectionName, next);

  return record;
}
