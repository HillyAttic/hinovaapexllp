/**
 * Firestore REST API client for Cloudflare Workers.
 * Uses the REST API since firebase-admin SDK requires Node.js APIs.
 */

interface FirestoreConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

interface FirestoreDoc {
  name: string;
  fields: Record<string, { stringValue?: string; integerValue?: string; booleanValue?: boolean; timestampValue?: string; mapValue?: { fields: Record<string, any> } }>;
  createTime: string;
  updateTime: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

function parseServiceAccount(json: string): FirestoreConfig {
  const sa = JSON.parse(json);
  return {
    projectId: sa.project_id,
    clientEmail: sa.client_email,
    privateKey: sa.private_key,
  };
}

async function getAccessToken(config: FirestoreConfig): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: config.clientEmail,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  // Import private key for signing
  const pemKey = config.privateKey.replace(/\\n/g, '\n');
  const pemContents = pemKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    bytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(dataToSign)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${dataToSign}.${encodedSignature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json() as { access_token: string; expires_in: number };
  cachedToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in - 60) * 1000,
  };

  return cachedToken.token;
}

function firestoreUrl(projectId: string, collection: string, docId?: string): string {
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  return docId ? `${base}/${collection}/${docId}` : `${base}/${collection}`;
}

function encodeValue(value: any): any {
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return { integerValue: String(value) };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (value === null || value === undefined) return { nullValue: null };
  return { stringValue: String(value) };
}

function decodeValue(field: any): any {
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return Number(field.integerValue);
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.timestampValue !== undefined) return field.timestampValue;
  if (field.nullValue !== undefined) return null;
  if (field.mapValue) {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(field.mapValue.fields || {})) {
      result[k] = decodeValue(v);
    }
    return result;
  }
  if (field.arrayValue) {
    return (field.arrayValue.values || []).map((v: any) => decodeValue(v));
  }
  return null;
}

function docToData(doc: FirestoreDoc): Record<string, any> {
  const data: Record<string, any> = { _id: doc.name.split('/').pop() };
  for (const [key, field] of Object.entries(doc.fields || {})) {
    data[key] = decodeValue(field);
  }
  return data;
}

export class FirestoreClient {
  private config: FirestoreConfig;
  private projectId: string;

  constructor(serviceAccountJson: string) {
    this.config = parseServiceAccount(serviceAccountJson);
    this.projectId = this.config.projectId;
  }

  private async request(method: string, url: string, body?: any): Promise<any> {
    const token = await getAccessToken(this.config);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Firestore error (${res.status}): ${error}`);
    }

    return res.json();
  }

  async add(collection: string, data: Record<string, any>): Promise<string> {
    const fields: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields[key] = encodeValue(value);
      }
    }

    const url = firestoreUrl(this.projectId, collection);
    const result = await this.request('POST', url, { fields });
    return result.name.split('/').pop()!;
  }

  async get(collection: string, docId: string): Promise<Record<string, any> | null> {
    try {
      const url = firestoreUrl(this.projectId, collection, docId);
      const result = await this.request('GET', url);
      return docToData(result);
    } catch (e: any) {
      if (e.message.includes('404')) return null;
      throw e;
    }
  }

  async getAll(collection: string, orderBy?: string, limit?: number): Promise<Record<string, any>[]> {
    let url = firestoreUrl(this.projectId, collection);
    const params: string[] = [];
    if (orderBy) params.push(`orderBy=${orderBy}`);
    if (limit) params.push(`pageSize=${limit}`);
    if (params.length) url += '?' + params.join('&');

    const result = await this.request('GET', url);
    return (result.documents || []).map(docToData);
  }

  async query(
    collection: string,
    field: string,
    op: string,
    value: string,
    orderBy?: string,
    limit?: number
  ): Promise<Record<string, any>[]> {
    const structuredQuery = {
      from: [{ collectionId: collection }],
      where: {
        fieldFilter: {
          field: { fieldPath: field },
          op,
          value: encodeValue(value),
        },
      },
      orderBy: orderBy ? [{ field: { fieldPath: orderBy }, direction: 'DESCENDING' }] : [],
      limit: limit || 100,
    };

    const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents:runQuery`;
    const token = await getAccessToken(this.config);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(structuredQuery),
    });

    if (!res.ok) throw new Error(`Firestore query error: ${await res.text()}`);
    const results = await res.json() as any[];
    return results
      .filter((r: any) => r.document)
      .map((r: any) => docToData(r.document));
  }

  async update(collection: string, docId: string, data: Record<string, any>): Promise<void> {
    const fields: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields[key] = encodeValue(value);
      }
    }

    const url = firestoreUrl(this.projectId, collection, docId);
    await this.request('PATCH', url, { fields });
  }

  async delete(collection: string, docId: string): Promise<void> {
    const url = firestoreUrl(this.projectId, collection, docId);
    await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${await getAccessToken(this.config)}`,
      },
    });
  }
}
