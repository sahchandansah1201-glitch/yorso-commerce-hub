import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { FileSpoolRegistrationVerificationSender } from "./delivery-sender.js";

const tempDirs: string[] = [];

async function createTempDir() {
  const dir = await mkdtemp(join(tmpdir(), "yorso-registration-delivery-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
});

describe("file spool registration verification sender", () => {
  it("writes a durable self-hosted delivery handoff file without provider coupling", async () => {
    const spoolDir = await createTempDir();
    const sender = new FileSpoolRegistrationVerificationSender({ spoolDir });

    await sender.send({
      channel: "email",
      deliveryId: "00000000-0000-4000-8000-000000000701",
      destination: "buyer@yorso.test",
      destinationPreview: "b***@yorso.test",
      draftId: "draft-registration-1",
      purpose: "email_verification",
      templateKey: "registration_email_verification",
      verificationCode: "418293",
    });

    const files = await readdir(spoolDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toContain("00000000-0000-4000-8000-000000000701");

    const fullPath = join(spoolDir, files[0]);
    const fileStat = await stat(fullPath);
    expect(fileStat.mode & 0o777).toBe(0o600);

    const payload = JSON.parse(await readFile(fullPath, "utf8")) as Record<string, unknown>;
    expect(payload).toMatchObject({
      schemaVersion: 1,
      type: "registration_verification_delivery",
      channel: "email",
      deliveryId: "00000000-0000-4000-8000-000000000701",
      destination: "buyer@yorso.test",
      destinationPreview: "b***@yorso.test",
      draftId: "draft-registration-1",
      purpose: "email_verification",
      templateKey: "registration_email_verification",
      verificationCode: "418293",
      subject: "YORSO registration verification",
    });
    expect(JSON.stringify(payload)).not.toContain("SUPABASE");
    expect(payload).not.toHaveProperty("provider");
    expect(payload.verificationCode).toBe("418293");
    expect(payload).not.toHaveProperty("code");
  });

  it("renders channel-specific operator copy for phone delivery handoff", async () => {
    const spoolDir = await createTempDir();
    const sender = new FileSpoolRegistrationVerificationSender({ spoolDir });

    await sender.send({
      channel: "whatsapp",
      deliveryId: "00000000-0000-4000-8000-000000000702",
      destination: "+34600000000",
      destinationPreview: "***00",
      draftId: "draft-registration-2",
      purpose: "phone_verification",
      templateKey: "registration_whatsapp_verification",
      verificationCode: "629104",
    });

    const [file] = await readdir(spoolDir);
    const payload = JSON.parse(await readFile(join(spoolDir, file), "utf8")) as Record<string, unknown>;

    expect(payload.channel).toBe("whatsapp");
    expect(payload.text).toContain("phone verification");
    expect(payload.text).toContain("***00");
    expect(payload.text).toContain("629104");
    expect(JSON.stringify(payload)).not.toContain("123456");
  });
});
