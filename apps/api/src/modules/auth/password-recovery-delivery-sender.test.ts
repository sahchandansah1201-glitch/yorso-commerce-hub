import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { FileSpoolPasswordRecoverySender } from "./password-recovery-delivery-sender.js";

const tempDirs: string[] = [];

async function createTempDir() {
  const dir = await mkdtemp(join(tmpdir(), "yorso-password-recovery-delivery-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
});

describe("file spool password recovery sender", () => {
  it("writes a durable self-hosted reset handoff file without provider coupling", async () => {
    const spoolDir = await createTempDir();
    const sender = new FileSpoolPasswordRecoverySender({
      publicAppUrl: "https://app.yorso.test",
      spoolDir,
    });

    await sender.send({
      deliveryId: "00000000-0000-4000-8000-000000000501",
      destination: "recovery@yorso.test",
      destinationPreview: "r***@yorso.test",
      recoveryId: "00000000-0000-4000-8000-000000000502",
      recoveryToken: "abcdefghijklmnopqrstuvwxyzABCDEF123456",
      templateKey: "password_recovery_email",
    });

    const files = await readdir(spoolDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toContain("00000000-0000-4000-8000-000000000501");

    const fullPath = join(spoolDir, files[0]);
    const fileStat = await stat(fullPath);
    expect(fileStat.mode & 0o777).toBe(0o600);

    const payload = JSON.parse(await readFile(fullPath, "utf8")) as Record<string, unknown>;
    expect(payload).toMatchObject({
      schemaVersion: 1,
      type: "password_recovery_delivery",
      deliveryId: "00000000-0000-4000-8000-000000000501",
      destination: "recovery@yorso.test",
      destinationPreview: "r***@yorso.test",
      recoveryId: "00000000-0000-4000-8000-000000000502",
      recoveryToken: "abcdefghijklmnopqrstuvwxyzABCDEF123456",
      resetUrl: "https://app.yorso.test/reset-password?token=abcdefghijklmnopqrstuvwxyzABCDEF123456",
      subject: "YORSO password reset",
      templateKey: "password_recovery_email",
    });
    expect(payload.text).toContain("r***@yorso.test");
    expect(payload.text).toContain("https://app.yorso.test/reset-password?token=abcdefghijklmnopqrstuvwxyzABCDEF123456");
    expect(JSON.stringify(payload)).not.toContain("SUPABASE");
    expect(payload).not.toHaveProperty("provider");
  });
});
