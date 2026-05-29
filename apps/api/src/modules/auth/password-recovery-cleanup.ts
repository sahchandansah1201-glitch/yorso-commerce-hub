import type {
  AuthRepository,
  PasswordRecoveryCleanupResult,
} from "./repository.js";

export interface PasswordRecoveryCleanupPolicy {
  deliveryRetentionMs?: number;
  expiredTokenRetentionMs?: number;
  limit?: number;
  now?: () => Date;
}

export interface PasswordRecoveryCleanupRunResult extends PasswordRecoveryCleanupResult {
  deliveryUpdatedBefore: string;
  expiredBefore: string;
  limit: number;
}

const defaultDeliveryRetentionMs = 7 * 24 * 60 * 60 * 1000;
const defaultExpiredTokenRetentionMs = 24 * 60 * 60 * 1000;
const defaultLimit = 500;

export class PasswordRecoveryCleanupWorker {
  constructor(
    private readonly repository: Pick<AuthRepository, "cleanupPasswordRecovery">,
    private readonly policy: PasswordRecoveryCleanupPolicy = {},
  ) {}

  async runOnce(): Promise<PasswordRecoveryCleanupRunResult> {
    const now = this.policy.now?.() ?? new Date();
    const deliveryRetentionMs = this.policy.deliveryRetentionMs ?? defaultDeliveryRetentionMs;
    const expiredTokenRetentionMs = this.policy.expiredTokenRetentionMs ?? defaultExpiredTokenRetentionMs;
    const limit = this.policy.limit ?? defaultLimit;
    const deliveryUpdatedBefore = new Date(now.getTime() - deliveryRetentionMs);
    const expiredBefore = new Date(now.getTime() - expiredTokenRetentionMs);
    const result = await this.repository.cleanupPasswordRecovery({
      deliveryUpdatedBefore,
      expiredBefore,
      limit,
    });

    return {
      ...result,
      deliveryUpdatedBefore: deliveryUpdatedBefore.toISOString(),
      expiredBefore: expiredBefore.toISOString(),
      limit,
    };
  }
}
