import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
  const manifestPath = process.env.VALIDATION_MANIFEST_PATH;
  if (!manifestPath) {
    return NextResponse.json(
      { error: 'VALIDATION_MANIFEST_PATH is not set. Add it to frontend/.env.local' },
      { status: 500 }
    );
  }

  try {
    const txt = await fs.readFile(manifestPath, 'utf-8');
    const json = JSON.parse(txt);
    return NextResponse.json({ ok: true, manifestPath, manifest: json });
  } catch (e: any) {
    if (e?.code === 'ENOENT') {
      return NextResponse.json({ ok: true, manifestPath, manifest: null });
    }
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const manifestPath = process.env.VALIDATION_MANIFEST_PATH;
  if (!manifestPath) {
    return NextResponse.json(
      { error: 'VALIDATION_MANIFEST_PATH is not set. Add it to frontend/.env.local' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const selected = Array.isArray(body?.selected) ? body.selected : null;
    const meta = body?.meta ?? {};

    if (!selected) {
      return NextResponse.json({ error: 'Body must be { selected: string[] }' }, { status: 400 });
    }

    const payload = {
      saved_at: new Date().toISOString(),
      selected_count: selected.length,
      selected,
      meta,
    };

    const dir = path.dirname(manifestPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(manifestPath, JSON.stringify(payload, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, manifestPath, saved: payload });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
