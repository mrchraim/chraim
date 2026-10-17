import express from "express";
import crypto from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const PORT = Number(process.env.PORT || 3000);
const SITE_URL = (process.env.SITE_URL || "").replace(/\/+$/, "");
const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID || "";
const NETLIFY_AUTH_TOKEN = process.env.NETLIFY_AUTH_TOKEN || "";
const MCP_BEARER_TOKEN = process.env.MCP_BEARER_TOKEN || "";

if (!SITE_URL || !MCP_BEARER_TOKEN) {
  console.error("Required environment variables: SITE_URL and MCP_BEARER_TOKEN");
  process.exit(1);
}
try {
  const u = new URL(SITE_URL);
  if (u.protocol !== "https:") throw new Error();
} catch {
  console.error("SITE_URL must be a valid HTTPS URL.");
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: "8mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "CHRVVIM Campus MCP" }));

function authorized(req, res, next) {
  const auth = req.headers.authorization || "";
  const supplied = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const a = Buffer.from(supplied);
  const b = Buffer.from(MCP_BEARER_TOKEN);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
app.use("/mcp", authorized);

let stagedHtml = null;
let stagedAt = null;
let stagedDescription = null;

async function getLiveHtml() {
  const response = await fetch(SITE_URL + "/", { redirect: "follow" });
  if (!response.ok) throw new Error(`Could not read live site: HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) throw new Error("The site's root URL did not return HTML.");
  return await response.text();
}
function htmlToText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<(?:nav|footer|header)\b[^>]*>[\s\S]*?<\/(?:nav|footer|header)>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ").trim();
}
function makeServer() {
  const server = new McpServer({
    name: "chrvvim-campus",
    version: "1.0.0",
  });

  server.tool(
    "read_live_site",
    "Read the public CHRVVIM Campus homepage as text. Read-only; does not change the site.",
    {},
    async () => {
      const html = await getLiveHtml();
      return { content: [{ type: "text", text: htmlToText(html).slice(0, 45000) }] };
    }
  );

  server.tool(
    "search_live_site",
    "Search visible text in the public homepage for a phrase. Read-only. This first version searches the homepage only, not PDFs or every linked page.",
    { query: z.string().min(2).max(200).describe("Words or phrase to find") },
    async ({ query }) => {
      const text = htmlToText(await getLiveHtml());
      const q = query.toLocaleLowerCase();
      const lower = text.toLocaleLowerCase();
      const matches = [];
      let at = 0;
      while ((at = lower.indexOf(q, at)) !== -1 && matches.length < 12) {
        matches.push(text.slice(Math.max(0, at - 180), Math.min(text.length, at + query.length + 260)));
        at += Math.max(1, query.length);
      }
      return { content: [{ type: "text", text: matches.length
        ? `Found ${matches.length} match(es) on ${SITE_URL}/:\\n\\n${matches.join("\\n---\\n")}`
        : `No match for "${query}" found in the homepage's visible text. This tool does not yet index linked PDFs or separate pages.` }] };
    }
  );

  server.tool(
    "stage_text_replacement",
    "Prepare an edit to the live homepage without publishing it. The exact text must occur exactly once. Review the returned preview, then separately call publish_staged_update only if you explicitly approve deployment.",
    {
      find_text: z.string().min(1).max(5000),
      replace_with: z.string().max(10000),
      description: z.string().min(3).max(300).describe("Short explanation of the proposed edit")
    },
    async ({ find_text, replace_with, description }) => {
      const html = await getLiveHtml();
      const count = html.split(find_text).length - 1;
      if (count !== 1) {
        return { isError: true, content: [{ type: "text", text: `Edit not staged: exact text must occur once, but it occurs ${count} time(s). Use a more specific unique text fragment. No changes were published.` }] };
      }
      stagedHtml = html.replace(find_text, replace_with);
      stagedAt = new Date().toISOString();
      stagedDescription = description;
      const before = html.slice(Math.max(0, html.indexOf(find_text) - 180), html.indexOf(find_text) + find_text.length + 180);
      const afterAt = stagedHtml.indexOf(replace_with);
      const after = stagedHtml.slice(Math.max(0, afterAt - 180), afterAt + replace_with.length + 180);
      return { content: [{ type: "text", text:
        `STAGED ONLY — NOT PUBLISHED\\nDescription: ${description}\\nStaged at: ${stagedAt}\\n\\nBEFORE:\\n${before}\\n\\nAFTER:\\n${after}\\n\\nReview this preview carefully. The live site is unchanged. To publish, separately invoke publish_staged_update after you approve this exact change.` }] };
    }
  );

  server.tool(
    "discard_staged_update",
    "Discard the pending homepage edit. Does not change the live site.",
    {},
    async () => {
      stagedHtml = null; stagedAt = null; stagedDescription = null;
      return { content: [{ type: "text", text: "Pending staged edit discarded. The live site was not changed." }] };
    }
  );

  server.tool(
    "publish_staged_update",
    "PUBLISHES the staged homepage HTML to the live Netlify production site. This action changes the public site. Call only after the user has explicitly approved the exact staged preview. Requires NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN. Deploys /index.html only, so use only if the website is a self-contained single HTML file.",
    { explicit_user_approval: z.literal("I approve publishing the reviewed staged change") },
    async ({ explicit_user_approval }) => {
      if (explicit_user_approval !== "I approve publishing the reviewed staged change") throw new Error("Approval text did not match.");
      if (!stagedHtml) throw new Error("No staged change exists. Stage and review a change first.");
      if (!NETLIFY_SITE_ID || !NETLIFY_AUTH_TOKEN) throw new Error("Publishing is disabled until NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN are configured.");
      const html = Buffer.from(stagedHtml, "utf8");
      const sha1 = crypto.createHash("sha1").update(html).digest("hex");
      const api = "https://api.netlify.com/api/v1";
      const headers = { Authorization: `Bearer ${NETLIFY_AUTH_TOKEN}`, "Content-Type": "application/json" };
      const create = await fetch(`${api}/sites/${encodeURIComponent(NETLIFY_SITE_ID)}/deploys`, {
        method: "POST", headers, body: JSON.stringify({ files: { "/index.html": sha1 } })
      });
      if (!create.ok) throw new Error(`Netlify deploy creation failed: HTTP ${create.status}: ${(await create.text()).slice(0,500)}`);
      const deploy = await create.json();
      if ((deploy.required || []).includes(sha1)) {
        const upload = await fetch(`${api}/deploys/${encodeURIComponent(deploy.id)}/files/index.html`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${NETLIFY_AUTH_TOKEN}`, "Content-Type": "application/octet-stream" },
          body: html
        });
        if (!upload.ok) throw new Error(`Netlify file upload failed: HTTP ${upload.status}: ${(await upload.text()).slice(0,500)}`);
      }
      stagedHtml = null; stagedAt = null;
      const description = stagedDescription;
      stagedDescription = null;
      return { content: [{ type: "text", text: `Netlify deploy created for the approved change: ${description}\\nDeploy ID: ${deploy.id}\\nState: ${deploy.state || "processing"}\\nCheck the deploy in the Netlify dashboard before assuming it is live. This deploy contains /index.html only.` }] };
    }
  );

  return server;
}

app.post("/mcp", async (req, res) => {
  const server = makeServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => { transport.close(); server.close(); });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request error:", error);
    if (!res.headersSent) res.status(500).json({ error: "MCP request failed" });
  }
});
app.get("/mcp", (_req, res) => res.status(405).send("Use POST for MCP requests."));
app.delete("/mcp", (_req, res) => res.status(405).send("Stateless MCP endpoint."));

app.listen(PORT, "0.0.0.0", () => console.log(`CHRVVIM Campus MCP listening on ${PORT}`));
