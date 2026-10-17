# CHRVVIM Campus — Remote MCP starter

A small remote MCP server for Claude that can:
- Read the public homepage as text.
- Search visible text on the homepage.
- Stage an exact text replacement and show a preview.
- Publish the staged HTML to Netlify only after a separate explicit tool call.

## Important limitations

1. This starter deploys **only `/index.html`**. The supplied `chrvvim_campus_founder_updated.html` appears to contain inline CSS/JS and a data-URI favicon, but verify whether your actual Netlify deploy has other assets. If it uses external PDFs/images/CSS/JS files, the deployment routine must be changed to include the complete site file set before enabling publish.
2. Search currently indexes the live homepage's visible text only. It does not crawl linked pages or search the contents of PDFs.
3. Staged HTML lives in server memory. If the hosting service restarts or scales to another instance, the staged change may be lost. Stage and publish promptly; for production, use durable staging storage and a deploy-preview workflow.
4. Authentication here is a single bearer token, not OAuth. Use a strong random token and HTTPS. Do not commit `.env` or secrets.
5. The publish tool creates a Netlify deploy. Confirm the final deploy status in Netlify before assuming it is live.

## Run locally

Requires Node.js 20+.

```bash
npm install
cp .env.example .env
# Fill in MCP_BEARER_TOKEN and SITE_URL. Keep Netlify variables blank initially.
npm start
```

Local health check: `http://localhost:3000/health`

A local URL is not reachable by Claude's cloud connector. Deploy the server to a public HTTPS host first.

## Deploy the MCP server

Deploy this folder as a Node web service on a host that supports persistent Node processes and public HTTPS (for example Render, Railway, or a similar service). Use:
- Build command: `npm install`
- Start command: `npm start`

Set environment variables in the hosting dashboard:
- `SITE_URL` = `https://mrchraimfsjpachrvvim.netlify.app`
- `MCP_BEARER_TOKEN` = a long random secret
- `NETLIFY_SITE_ID` = your Netlify Site ID (only when ready to enable publishing)
- `NETLIFY_AUTH_TOKEN` = your Netlify personal access token (only when ready to enable publishing)

Do not put secrets in source files or share them in chat. For a first test, leave the Netlify token and Site ID blank so publishing remains disabled.

## Add to Claude

Claude's custom connector feature supports remote MCP servers on eligible plans; availability can vary by plan/account. In Claude:
1. Settings → Connectors.
2. Add custom connector.
3. Enter your deployed MCP endpoint, ending in `/mcp`.
4. If Claude offers a supported authentication configuration, configure it to send `Authorization: Bearer YOUR_MCP_BEARER_TOKEN`. If your Claude connector UI cannot attach a bearer token for this custom server, do not remove server authentication; instead implement the official OAuth flow or use a compatible authenticated gateway.
5. Enable only the tools you intend to use.

## Netlify settings

- `NETLIFY_SITE_ID`: Netlify dashboard → your site → Site configuration / General / Site details.
- `NETLIFY_AUTH_TOKEN`: Netlify user settings → personal access tokens.
- Give the token the minimum available scope that supports deploys. If Netlify offers no deploy-only scope, understand that a personal token can grant broad account access.
- Never paste the token into Claude prompts. Store it only as a secret environment variable on the MCP host.

## Test in this order

1. Call `read_live_site`.
2. Call `search_live_site` with a phrase you know is on the homepage.
3. Stage a harmless exact text replacement using `stage_text_replacement`.
4. Inspect the preview. Call `discard_staged_update` if it is not right.
5. Only after explicit human approval, configure the Netlify credentials and call `publish_staged_update` with the exact approval string described by the tool schema.

## Production hardening before public use

- Add OAuth 2.1 or a secure authenticated gateway.
- Add durable staged-change storage, audit logs, rate limits, request-size limits and backups.
- Prefer deploy previews plus a human approval gate before production deploy.
- Add full-site asset packaging and PDF indexing if required.
- Restrict CORS if a browser client is ever added. This server is intended for Claude's server-to-server MCP connection, not direct frontend use.
