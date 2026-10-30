// Pluggable e-invoice provider layer (adapter pattern).
//
// Today only a `sandbox` provider ships: it derives a deterministic,
// IRN-shaped result from the NICV with NO network call, so the whole
// registration flow is testable end-to-end without government credentials.
//
// When real credentials exist, add a `DirectIrpProvider` / `FacilitatorProvider`
// behind the same interface and select it via the EINVOICE_PROVIDER env var.

import { createHash } from 'crypto';
import type { NicvPayload } from './nicv';

export interface EinvoiceResult {
  /** 64-hex IRN (sandbox derives it deterministically from the payload). */
  irn: string;
  /** Compact string encoded into the invoice QR. */
  qr: string;
  /** Signed NICV JSON (full payload + signature marker). */
  signedData: string;
  /** Acknowledgement number returned by the portal. */
  ackNo: string;
  /** True for sandbox/demo results. */
  demo?: boolean;
}

export interface EinvoiceProvider {
  readonly name: string;
  register(nicv: NicvPayload): Promise<EinvoiceResult>;
  cancel?(irn: string, ackNo?: string): Promise<void>;
}

class SandboxProvider implements EinvoiceProvider {
  readonly name = 'sandbox';

  async register(nicv: NicvPayload): Promise<EinvoiceResult> {
    const docNo = String(nicv.TranDtls.DocNo || '');
    const seller = String(nicv.SellerDtls.Gstin || '');
    const total = String(nicv.ValDtls.TotInvVal || '0');
    const digest = createHash('sha512').update(JSON.stringify(nicv)).digest('hex');
    const irn = digest.slice(0, 64); // real IRN is also a 64-char hex hash
    const ackNo = `ACK${digest.slice(64, 78).toUpperCase()}`;
    const signedData = JSON.stringify({ ...nicv, Signature: `sandbox:${irn}` });
    // Keep the QR payload compact and scannable (real IRP QR is likewise a
    // condensed signed token, not the full JSON).
    const qr = `${seller}|${docNo}|${total}|${irn.slice(0, 16)}`;
    return { irn, qr, signedData, ackNo, demo: true };
  }

  async cancel(): Promise<void> {
    // No-op for sandbox; a real provider would POST the cancel API to the IRP.
  }
}

/** Resolve the active provider from the EINVOICE_PROVIDER env var (default: sandbox). */
export function getProvider(): EinvoiceProvider {
  const kind = (process.env.EINVOICE_PROVIDER || 'sandbox').toLowerCase();
  switch (kind) {
    case 'sandbox':
    default:
      return new SandboxProvider();
  }
}
