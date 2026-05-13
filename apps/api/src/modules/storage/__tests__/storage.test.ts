import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LocalObjectStorage } from "../object-storage.js";
import { PostgresFileRepository } from "../postgres-repository.js";
import { MemoryFileRepository } from "../repository.js";
import { FileService } from "../service.js";

let tempRoot: string | undefined;

const makeTempRoot = async () => {
  tempRoot = await mkdtemp(path.join(tmpdir(), "yorso-storage-"));
  return tempRoot;
};

afterEach(async () => {
  if (!tempRoot) return;
  await rm(tempRoot, { recursive: true, force: true });
  tempRoot = undefined;
});

const uploadPayload = (content: string) => {
  const bytes = Buffer.from(content, "utf8");
  return {
    fileName: "certificate.pdf",
    contentType: "application/pdf",
    sizeBytes: bytes.byteLength,
    contentBase64: bytes.toString("base64"),
  };
};

describe("self-hosted file storage service", () => {
  it("stores local file bytes and creates file metadata with checksum", async () => {
    const service = new FileService(
      new MemoryFileRepository(),
      new LocalObjectStorage(await makeTempRoot()),
      { maxUploadBytes: 1024, storageDriver: "local" },
    );

    const asset = await service.storeAccountFile({
      userId: "00000000-0000-4000-8000-000000000001",
      companyId: "11111111-1111-4111-8111-111111111111",
      purpose: "company_document",
      upload: uploadPayload("document"),
    });
    const file = await service.getFileForUser("00000000-0000-4000-8000-000000000001", asset.id);

    expect(asset).toMatchObject({
      purpose: "company_document",
      originalFileName: "certificate.pdf",
      contentType: "application/pdf",
      sizeBytes: 8,
      storageDriver: "local",
    });
    expect(asset.objectKey).toContain("company_document");
    expect(asset.checksumSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(file.bytes.toString("utf8")).toBe("document");
    await expect(
      service.getFileByObjectKeyForUser(
        "00000000-0000-4000-8000-000000000001",
        asset.objectKey,
      ),
    ).resolves.toMatchObject({
      asset: expect.objectContaining({ id: asset.id }),
      contentType: "application/pdf",
    });
  });

  it("creates company document records linked to stored file assets", async () => {
    const service = new FileService(
      new MemoryFileRepository(),
      new LocalObjectStorage(await makeTempRoot()),
      { maxUploadBytes: 1024, storageDriver: "local" },
    );

    const document = await service.createCompanyDocument({
      userId: "00000000-0000-4000-8000-000000000001",
      companyId: "11111111-1111-4111-8111-111111111111",
      payload: {
        title: "BRC certificate",
        documentType: "brc",
        visibility: "buyer_qualified",
        expiresAt: "2027-05-13",
        file: uploadPayload("brc"),
      },
    });

    expect(document).toMatchObject({
      title: "BRC certificate",
      documentType: "brc",
      visibility: "buyer_qualified",
      status: "uploaded",
      fileName: "certificate.pdf",
      expiresAt: "2027-05-13",
    });
    await expect(service.listCompanyDocuments("11111111-1111-4111-8111-111111111111")).resolves.toHaveLength(1);
  });

  it("rejects mismatched upload sizes", async () => {
    const service = new FileService(
      new MemoryFileRepository(),
      new LocalObjectStorage(await makeTempRoot()),
      { maxUploadBytes: 1024, storageDriver: "local" },
    );

    await expect(
      service.storeAccountFile({
        userId: "00000000-0000-4000-8000-000000000001",
        companyId: null,
        purpose: "company_document",
        upload: {
          ...uploadPayload("abc"),
          sizeBytes: 999,
        },
      }),
    ).rejects.toThrow("upload_size_mismatch");
  });
});

describe("Postgres file repository SQL contract", () => {
  it("inserts file assets and company documents through self-hosted tables", async () => {
    const queries: Array<{ sql: string; params?: readonly unknown[] }> = [];
    const client = {
      async query<Row extends Record<string, unknown>>(sql: string, params?: readonly unknown[]) {
        queries.push({ sql, params });
        if (sql.includes("insert into yorso_file_assets")) {
          return {
            rows: [
              {
                id: "22222222-2222-4222-8222-222222222222",
                company_id: "11111111-1111-4111-8111-111111111111",
                purpose: "company_document",
                object_key: "companies/111/company_document/file.pdf",
                original_file_name: "file.pdf",
                content_type: "application/pdf",
                size_bytes: 10,
                checksum_sha256: "a".repeat(64),
                storage_driver: "local",
                created_at: new Date("2026-05-13T08:00:00.000Z"),
              },
            ] as Row[],
          };
        }
        return {
          rows: [
            {
              id: "33333333-3333-4333-8333-333333333333",
              company_id: "11111111-1111-4111-8111-111111111111",
              file_asset_id: "22222222-2222-4222-8222-222222222222",
              title: "Health certificate",
              document_type: "health_certificate",
              visibility: "private",
              status: "uploaded",
              original_file_name: "file.pdf",
              content_type: "application/pdf",
              size_bytes: 10,
              checksum_sha256: "a".repeat(64),
              expires_at: null,
              created_at: new Date("2026-05-13T08:00:00.000Z"),
              updated_at: new Date("2026-05-13T08:00:00.000Z"),
            },
          ] as Row[],
        };
      },
    };
    const repository = new PostgresFileRepository(
      { databaseUrl: "postgres://user:pass@localhost:5432/yorso" },
      { client },
    );

    const asset = await repository.createFileAsset({
      ownerUserId: "00000000-0000-4000-8000-000000000001",
      companyId: "11111111-1111-4111-8111-111111111111",
      purpose: "company_document",
      objectKey: "companies/111/company_document/file.pdf",
      originalFileName: "file.pdf",
      contentType: "application/pdf",
      sizeBytes: 10,
      checksumSha256: "a".repeat(64),
      storageDriver: "local",
    });
    const document = await repository.createCompanyDocument({
      companyId: "11111111-1111-4111-8111-111111111111",
      fileAssetId: asset.id,
      title: "Health certificate",
      documentType: "health_certificate",
      visibility: "private",
      expiresAt: null,
    });

    expect(asset.objectKey).toContain("company_document");
    expect(document.documentType).toBe("health_certificate");
    expect(queries.map((query) => query.sql).join("\n")).toContain("insert into yorso_file_assets");
    expect(queries.map((query) => query.sql).join("\n")).toContain("insert into yorso_company_documents");
  });
});
