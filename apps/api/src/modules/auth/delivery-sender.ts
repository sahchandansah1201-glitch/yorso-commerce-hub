import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { RegistrationVerificationDeliveryMessage, RegistrationVerificationDeliverySender } from "./delivery-worker.js";

export interface FileSpoolRegistrationVerificationSenderOptions {
  now?: () => Date;
  spoolDir: string;
}

export class FileSpoolRegistrationVerificationSender implements RegistrationVerificationDeliverySender {
  private readonly now: () => Date;

  constructor(private readonly options: FileSpoolRegistrationVerificationSenderOptions) {
    this.now = options.now ?? (() => new Date());
  }

  async send(message: RegistrationVerificationDeliveryMessage): Promise<void> {
    await mkdir(this.options.spoolDir, { recursive: true });
    const createdAt = this.now().toISOString();
    const payload = {
      schemaVersion: 1,
      type: "registration_verification_delivery",
      createdAt,
      channel: message.channel,
      deliveryId: message.deliveryId,
      destination: message.destination,
      destinationPreview: message.destinationPreview,
      draftId: message.draftId,
      purpose: message.purpose,
      templateKey: message.templateKey,
      verificationCode: message.verificationCode,
      subject: renderSubject(message),
      text: renderText(message),
    };
    const filePath = join(this.options.spoolDir, `${safeTimestamp(createdAt)}-${safeFilePart(message.deliveryId)}.json`);
    await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
  }
}

function renderSubject(message: RegistrationVerificationDeliveryMessage) {
  if (message.purpose === "email_verification") return "YORSO registration verification";
  return "YORSO phone verification";
}

function renderText(message: RegistrationVerificationDeliveryMessage) {
  const channel = message.channel === "whatsapp" ? "WhatsApp" : message.channel.toUpperCase();
  const target = message.purpose === "email_verification" ? "email verification" : "phone verification";
  return [
    `Create a ${target} delivery using the owned ${channel} channel.`,
    `Destination preview: ${message.destinationPreview}.`,
    `Template key: ${message.templateKey}.`,
    `Verification code: ${message.verificationCode}.`,
    "Do not copy this handoff file into public logs or browser-visible surfaces.",
  ].join(" ");
}

function safeTimestamp(value: string) {
  return value.replace(/[:.]/g, "-");
}

function safeFilePart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160);
}
