import { auth } from "@/lib/auth/server";

const handlers = auth.handler();

async function POST(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  try {
    const res = await handlers.POST(req, ctx);
    if (res.status >= 500) {
      const clone = res.clone();
      const text = await clone.text();
      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => (headers[k] = v));
      console.error("[Auth 500]", req.url, "status:", res.status, "body:", text || "(empty)", "headers:", JSON.stringify(headers));
    }
    return res;
  } catch (err) {
    console.error("[Auth POST error]", req.url, err);
    throw err;
  }
}

export const GET = handlers.GET;
export { POST };
