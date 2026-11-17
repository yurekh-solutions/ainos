// Direct NIC e-Way Bill API client (v1.03, current /auth flow).
// Uses the TAXPAYER'S OWN portal credentials (EWB portal → Registration → API):
//   username / password + client-id / client-secret + the taxpayer's GSTIN.
// Because each business uses its own government portal account, AINOS needs no
// GSP license and no paid aggregator. Crypto per the official NIC spec:
//   auth     : credentials JSON → base64 → RSA/ECB/PKCS1 with NIC public key → {"Data": "..."}
//   sek      : AES-encrypted with the random app_key (AES-128-ECB/PKCS5)
//   data APIs: JSON → AES-256-ECB/PKCS5 with decrypted SEK → {"Data": "..."}
// Real numbers only — there is deliberately no mock path (see ewaybill.ts).

import crypto from 'crypto';

// Base URL is env-settable so a gateway change never needs a code deploy.
const API_BASE = (process.env.EWB_API_BASE || 'https://ewb.nic.in/ewb/app').replace(/\/+$/, '');

// NIC publishes the EWB public key PEM; set it once at deploy (owner-level env,
// not per-tenant). Without it, credentials cannot be verified — surfaced clearly.
export const ewbPublicKey = (): string => (process.env.EWB_PUBLIC_KEY || '').trim();

export interface EwbCredentialSet {
  gstin: string;
  username: string;
  password: string;
  clientId: string;
  clientSecret: string;
}

const headers = (c: EwbCredentialSet, authtoken?: string): Record<string, string> => {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'client-id': c.clientId,
    'client-secret': c.clientSecret,
    Gstin: c.gstin,
  };
  if (authtoken) h.authtoken = authtoken;
  return h;
};

const postJson = async (url: string, reqHeaders: Record<string, string>, body: unknown) => {
  const res = await fetch(url, { method: 'POST', headers: reqHeaders, body: JSON.stringify(body) });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try { json = JSON.parse(text); } catch { json = { status: '0', error: `Unparseable portal response (${res.status})` }; }
  return { httpStatus: res.status, json };
};

// ── Crypto helpers ───────────────────────────────────────────────────────────
const rsaEncrypt = (plain: string, publicKeyPem: string): string => {
  const out = crypto.publicEncrypt(
    { key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(plain, 'utf8'),
  );
  return out.toString('base64');
};

// ECB needs no IV; key length selects aes-128 vs aes-256 automatically.
const aesEcbEncrypt = (plain: string, key: Buffer): string => {
  const algo = key.length === 16 ? 'aes-128-ecb' : 'aes-256-ecb';
  const cipher = crypto.createCipheriv(algo, key, null);
  return Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]).toString('base64');
};

const aesEcbDecrypt = (dataB64: string, key: Buffer): string => {
  const algo = key.length === 16 ? 'aes-128-ecb' : 'aes-256-ecb';
  const decipher = crypto.createDecipheriv(algo, key, null);
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
};

/** Decrypt the returned sek with the app_key, keep raw bytes base64'd for reuse. */
const decryptSek = (encryptedSekB64: string, appKey: Buffer): string => {
  const algo = appKey.length === 16 ? 'aes-128-ecb' : 'aes-256-ecb';
  const decipher = crypto.createDecipheriv(algo, appKey, null);
  const raw = Buffer.concat([decipher.update(Buffer.from(encryptedSekB64, 'base64')), decipher.final()]);
  return raw.toString('base64');
};

// ── Auth (token valid ~6h; regenerating is always safe) ──────────────────────
export interface EwbSession { authtoken: string; sekB64: string }

export async function authenticateEwb(c: EwbCredentialSet): Promise<EwbSession> {
  const pem = ewbPublicKey();
  if (!pem) throw new Error('Portal public key not configured (EWB_PUBLIC_KEY env)');

  const appKey = crypto.randomBytes(16); // 128-bit AES key, base64 in payload
  const creds = JSON.stringify({
    action: 'ACCESSTOKEN',
    username: c.username,
    password: c.password,
    app_key: appKey.toString('base64'),
  });
  const dataPayload = rsaEncrypt(Buffer.from(creds, 'utf8').toString('base64'), pem);

  const { json } = await postJson(`${API_BASE}/v1.03/auth`, headers(c), { Data: dataPayload });
  const status = String(json.status ?? '0');
  if (status !== '1') {
    const err = typeof json.error === 'string' ? json.error : 'Authentication rejected by the portal — check username, password, client-id and client-secret';
    throw new Error(err);
  }
  return { authtoken: String(json.authtoken), sekB64: decryptSek(String(json.sek), appKey) };
}

// ── Generate (real EWB) ──────────────────────────────────────────────────────
export interface EwbGenerateInput {
  supplyType: 'O' | 'I';
  subSupplyType: string;      // 1 Supply, 6 SKD/CKD, 8 others — CHL flow uses 1 unless job work
  docType: 'CHL' | 'INV';
  docNo: string;
  docDate: string;            // dd/mm/yyyy
  fromGstin: string; fromTrdName: string; fromAddr1: string; fromPlace: string;
  fromPincode: number; fromStateCode: number; actFromStateCode: number;
  toGstin: string; toTrdName: string; toAddr1: string; toPlace: string;
  toPincode: number; toStateCode: number; actToStateCode: number;
  totalValue: number; cgstValue: number; sgstValue: number; igstValue: number;
  totInvValue: number;
  transMode: '1' | '2' | '3' | '4';
  transDistance: string;
  transporterId?: string; transporterName?: string; transDocNo?: string; transDocDate?: string;
  vehicleNo?: string; vehicleType?: 'R' | 'O';
  itemList: Array<{ productName?: string; productDesc?: string; hsnCode?: number; quantity?: number;
    qtyUnit?: string; taxableAmount?: number; sgstRate?: number; cgstRate?: number; igstRate?: number; cessRate?: number }>;
}

export interface EwbGenerated { ewayBillNo: string; ewayBillDate: string; validUpto: string; alert?: string }

export async function generateEwb(c: EwbCredentialSet, session: EwbSession, input: EwbGenerateInput): Promise<EwbGenerated> {
  const sek = Buffer.from(session.sekB64, 'base64');
  const encrypted = aesEcbEncrypt(JSON.stringify(input), sek);
  const { json } = await postJson(
    `${API_BASE}/v1.03/ewayapi/genewaybill`,
    headers(c, session.authtoken),
    { Data: encrypted },
  );
  const status = String(json.status ?? '0');
  if (status !== '1') {
    const err = typeof json.error === 'string' ? json.error : 'E-Way Bill generation rejected by the portal';
    throw new Error(err);
  }
  const raw = aesEcbDecrypt(String(json.data), sek);
  const parsed = JSON.parse(raw) as { ewayBillNo?: string; ewayBillDate?: string; validUpto?: string; alert?: string };
  if (!parsed.ewayBillNo) throw new Error('Portal accepted the request but returned no EWB number');
  return {
    ewayBillNo: parsed.ewayBillNo,
    ewayBillDate: parsed.ewayBillDate || '',
    validUpto: parsed.validUpto || '',
    alert: parsed.alert,
  };
}
