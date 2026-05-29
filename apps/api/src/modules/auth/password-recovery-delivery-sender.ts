import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { PasswordRecoveryDeliveryMessage, PasswordRecoveryDeliverySender } from "./password-recovery-delivery-worker.js";

export interface FileSpoolPasswordRecoverySenderOptions {
  now?: () => Date;
  publicAppUrl: string;
  spoolDir: string;
}

export class FileSpoolPasswordRecoverySender implements PasswordRecoveryDeliverySender {
  private readonly now: () => Date;

  constructor(private readonly options: FileSpoolPasswordRecoverySenderOptions) {
    this.now = options.now ?? (() => new Date());
  }

  async send(message: PasswordRecoveryDeliveryMessage): Promise<void> {
    await mkdir(this.options.spoolDir, { recursive: true });
    const createdAt = this.now().toISOString();
    const resetUrl = createResetUrl(this.options.publicAppUrl, message.recoveryToken);
    const payload = {
      schemaVersion: 1,
      type: "password_recovery_delivery",
      createdAt,
      deliveryId: message.deliveryId,
      destination: message.destination,
      destinationPreview: message.destinationPreview,
      recoveryId: message.recoveryId,
      recoveryToken: message.recoveryToken,
      resetUrl,
      subject: "YORSO password reset",
      templateKey: message.templateKey,
      text: renderText(message, resetUrl),
    };
    const filePath = join(this.options.spoolDir, `${safeTimestamp(createdAt)}-${safeFilePart(message.deliveryId)}.json`);
    await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
  }
}

function createResetUrl(publicAppUrl: string, recoveryToken: string) {
  const url = new URL("/reset-password", publicAppUrl);
  url.searchParams.set("token", recoveryToken);
  return url.toString();
}

function renderText(message: PasswordRecoveryDeliveryMessage, resetUrl: string) {
  return [
    "Create a password reset delivery using the owned email channel.",
    `Destination preview: ${message.destinationPreview}.`,
    `Template key: ${message.templateKey}.`,
    `Reset URL: ${resetUrl}.`,
    "Do not copy this handoff file into public logs or browser-visible surfaces.",
  ].join(" ");
}

function safeTimestamp(value: string) {
  return value.replace(/[:.]/g, "-");
}

function safeFilePart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160);
}
