import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PDF_BYTES = 75 * 1024 * 1024;
const MAX_REDIRECTS = 4;
const FETCH_TIMEOUT_MS = 30_000;

class ImportError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

function isPrivateIPv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return true;
  }

  const [a, b, c] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIPv6(address: string) {
  const normalized = address.toLowerCase().split("%")[0];
  if (
    normalized.startsWith("::") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  ) {
    return true;
  }

  const mappedIPv4 = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mappedIPv4 ? isPrivateIPv4(mappedIPv4) : false;
}

function isPrivateAddress(address: string) {
  const version = isIP(address);
  if (version === 4) return isPrivateIPv4(address);
  if (version === 6) return isPrivateIPv6(address);
  return true;
}

async function assertPublicUrl(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new ImportError("The PDF link must use http:// or https://.");
  }
  if (url.username || url.password) {
    throw new ImportError("Links containing usernames or passwords are blocked.");
  }

  const hostname = url.hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new ImportError("Private network links are not supported.");
  }

  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      throw new ImportError("Private network links are not supported.");
    }
    return;
  }

  let addresses: { address: string; family: number }[];
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new ImportError("The website address could not be found.", 422);
  }

  if (
    addresses.length === 0 ||
    addresses.some(({ address }) => isPrivateAddress(address))
  ) {
    throw new ImportError("Private network links are not supported.");
  }
}

async function fetchWithRedirectChecks(initialUrl: URL) {
  let currentUrl = initialUrl;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    await assertPublicUrl(currentUrl);

    const response = await fetch(currentUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        Accept: "application/pdf,application/octet-stream;q=0.9,*/*;q=0.5",
        "User-Agent": "Folio-PDF-Reader/1.0",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new ImportError("The PDF link redirects incorrectly.");
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    return response;
  }

  throw new ImportError("The PDF link has too many redirects.");
}

async function readLimitedBody(response: Response) {
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > MAX_PDF_BYTES) {
    throw new ImportError("This PDF is larger than the 75 MB import limit.", 413);
  }
  if (!response.body) {
    throw new ImportError("The website returned an empty response.", 422);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_PDF_BYTES) {
      await reader.cancel();
      throw new ImportError(
        "This PDF is larger than the 75 MB import limit.",
        413,
      );
    }
    chunks.push(value);
  }

  const data = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return data;
}

function hasPDFSignature(data: Uint8Array) {
  return (
    data.length >= 5 &&
    data[0] === 0x25 &&
    data[1] === 0x50 &&
    data[2] === 0x44 &&
    data[3] === 0x46 &&
    data[4] === 0x2d
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: unknown };
    if (typeof body.url !== "string" || !body.url.trim()) {
      throw new ImportError("Enter a PDF link.");
    }

    let url: URL;
    try {
      url = new URL(body.url);
    } catch {
      throw new ImportError("Enter a valid PDF link.");
    }

    const response = await fetchWithRedirectChecks(url);
    if (!response.ok) {
      throw new ImportError(
        `The website returned an error (${response.status}).`,
        422,
      );
    }

    const data = await readLimitedBody(response);
    if (!hasPDFSignature(data)) {
      throw new ImportError(
        "That link did not return a PDF. Use the direct PDF file link.",
        422,
      );
    }

    return new Response(data, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Length": String(data.byteLength),
        "Content-Type": "application/pdf",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof ImportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "The website took too long to return the PDF." },
        { status: 504 },
      );
    }

    return NextResponse.json(
      { error: "The PDF could not be fetched from that website." },
      { status: 502 },
    );
  }
}
