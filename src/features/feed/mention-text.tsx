"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { resolveUsernameToId } from "./feed-service";

/** Matches `@handle` only when it starts the body or follows
 *  whitespace — keeps emails (foo@bar.com) and double-@ from being
 *  rendered as mentions. Handles are [A-Za-z0-9_], 1-32 chars. */
const MENTION_RE = /(^|\s)@([A-Za-z0-9_]{1,32})/g;

/** Renders a comment / post body with `@username` mentions styled as
 *  tappable violet spans. Tap resolves the handle to a profile id and
 *  routes to `/feed/u/<id>`, or shows a "not found" toast.
 *
 *  Drop-in for `{body}` — keeps the surrounding `<p>` tag with its
 *  current text styling; only the mention spans diverge in color. */
export function MentionText({ body }: { body: string }) {
  const router = useRouter();

  MENTION_RE.lastIndex = 0;
  const parts: Array<string | { handle: string; key: string }> = [];
  let cursor = 0;
  let i = 0;
  for (const m of body.matchAll(MENTION_RE)) {
    const lead = m[1] ?? "";
    const handle = m[2]!;
    const start = (m.index ?? 0) + lead.length;
    if (start > cursor) parts.push(body.slice(cursor, start));
    parts.push({ handle, key: `${start}-${i++}` });
    cursor = (m.index ?? 0) + m[0].length;
  }
  if (cursor < body.length) parts.push(body.slice(cursor));

  // No mentions — render as a single text node so the rendered DOM
  // is identical to plain `{body}`.
  if (parts.every((p) => typeof p === "string")) {
    return <>{body}</>;
  }

  return (
    <>
      {parts.map((p, idx) =>
        typeof p === "string" ? (
          <span key={idx}>{p}</span>
        ) : (
          <button
            key={p.key}
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              const id = await resolveUsernameToId(p.handle);
              if (!id) {
                toast.error(`@${p.handle} not found.`);
                return;
              }
              router.push(`/feed/u/${id}`);
            }}
            className="font-bold text-violet-600 hover:underline dark:text-violet-300"
          >
            @{p.handle}
          </button>
        ),
      )}
    </>
  );
}
