import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SUPPLIER_ACCESS_CHANGE_EVENT,
  getSupplierAccessRequest,
  type SupplierAccessRequest,
} from "@/lib/supplier-access-requests";
import {
  isSupplierAccessApiConfigured,
  readSupplierAccessRequest,
  requestSupplierAccess,
} from "@/lib/supplier-access-api";

export interface SupplierAccessState {
  request: SupplierAccessRequest | null;
  setRequest: (request: SupplierAccessRequest | null) => void;
  refresh: () => void;
  submit: () => Promise<SupplierAccessRequest | null>;
}

export const useSupplierAccessState = (
  supplierId: string | null | undefined,
  options: { enabled?: boolean } = {},
): SupplierAccessState => {
  const enabled = options.enabled ?? true;
  const storageSupplierId = supplierId ?? undefined;
  const [request, setRequest] = useState<SupplierAccessRequest | null>(
    () => (enabled && !isSupplierAccessApiConfigured() ? getSupplierAccessRequest(storageSupplierId) : null),
  );
  const mountedRef = useRef(false);
  const refreshSeqRef = useRef(0);

  const refresh = useCallback(() => {
    const refreshSeq = ++refreshSeqRef.current;
    const commit = (next: SupplierAccessRequest | null) => {
      if (mountedRef.current && refreshSeq === refreshSeqRef.current) {
        setRequest(next);
      }
    };

    if (!enabled || !storageSupplierId) {
      commit(null);
      return;
    }

    if (isSupplierAccessApiConfigured()) {
      commit(null);
    } else {
      commit(getSupplierAccessRequest(storageSupplierId));
    }
    void readSupplierAccessRequest(storageSupplierId).then((next) => {
      commit(next);
    });
  }, [enabled, storageSupplierId]);

  const submit = useCallback(async () => {
    if (!enabled || !storageSupplierId) return null;
    const saved = await requestSupplierAccess(storageSupplierId);
    if (mountedRef.current) setRequest(saved);
    return saved;
  }, [enabled, storageSupplierId]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    if (!enabled || !storageSupplierId || typeof window === "undefined") {
      return () => {
        mountedRef.current = false;
        refreshSeqRef.current += 1;
      };
    }

    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.includes("supplier_access_requests")) refresh();
    };
    const onLocalChange = () => refresh();

    window.addEventListener("storage", onStorage);
    window.addEventListener(SUPPLIER_ACCESS_CHANGE_EVENT, onLocalChange);
    return () => {
      mountedRef.current = false;
      refreshSeqRef.current += 1;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SUPPLIER_ACCESS_CHANGE_EVENT, onLocalChange);
    };
  }, [enabled, refresh, storageSupplierId]);

  return useMemo(
    () => ({
      request,
      setRequest,
      refresh,
      submit,
    }),
    [request, refresh, submit],
  );
};
