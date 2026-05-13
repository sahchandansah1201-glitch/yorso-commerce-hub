import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface StoredObject {
  bytes: Buffer;
  contentType: string;
}

export interface ObjectStorage {
  putObject(objectKey: string, bytes: Buffer, metadata: { contentType: string }): Promise<void>;
  getObject(objectKey: string): Promise<StoredObject>;
}

export class LocalObjectStorage implements ObjectStorage {
  private readonly root: string;

  constructor(root: string) {
    if (!root.trim()) throw new Error("LocalObjectStorage requires a storage root.");
    this.root = path.resolve(root);
  }

  async putObject(objectKey: string, bytes: Buffer, metadata: { contentType: string }) {
    const filePath = this.resolveObjectPath(objectKey);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, bytes);
    await writeFile(`${filePath}.metadata.json`, JSON.stringify({ contentType: metadata.contentType }, null, 2));
  }

  async getObject(objectKey: string): Promise<StoredObject> {
    const filePath = this.resolveObjectPath(objectKey);
    const [bytes, metadataRaw] = await Promise.all([
      readFile(filePath),
      readFile(`${filePath}.metadata.json`, "utf8").catch(() => "{}"),
    ]);
    const metadata = JSON.parse(metadataRaw) as { contentType?: string };
    return {
      bytes,
      contentType: metadata.contentType ?? "application/octet-stream",
    };
  }

  private resolveObjectPath(objectKey: string) {
    const normalized = objectKey.replace(/^\/+/, "");
    const filePath = path.resolve(this.root, normalized);
    if (!filePath.startsWith(`${this.root}${path.sep}`)) {
      throw new Error("invalid_object_key");
    }
    return filePath;
  }
}
