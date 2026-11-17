# Comprimage security audit

Date: 2026-11-16. Reviewed source revision: `4e6ce12`.

## Executive summary

The audit identified three medium-priority findings and two low-priority findings. Prioritize upgrading the nginx production image, adding compatible browser security headers, and verifying the deployment server's SSH fingerprint. No working nginx exploit or exploitable application XSS path was established. `bun audit` reported no known vulnerabilities across 481 packages; this does not cover container packages or prove the application is free of vulnerabilities.

This report records the approved read-only audit and its follow-up recommendations. Repository evidence, package checks, and one ordinary production response were rechecked while preparing it. The existing untracked `public/sw.js` is outside the reviewed revision and remains untouched.

## Scope and evidence

Comprimage is a client-only React 19 and TanStack Start image-processing SPA. The Docker build emits static files, nginx serves them, and a shared Traefik proxy handles the public hostname and TLS. Images are processed in the visitor's browser. There is no application image-upload endpoint to rate-limit.

The review covers application input handling, worker availability, nginx and Compose configuration, the deployment workflow, and npm advisory coverage for the current lockfile. Production observations below refer to `https://comprimage.my.id/`. The direct-client-to-Traefik topology was confirmed in the approved audit; the shared proxy's version and full configuration were not inspected here.

## Medium-priority findings

### SEC-001: Production nginx is outdated

Local implementation: upgraded the production base to `nginx:1.30.6-alpine`. The image pulled successfully and the upstream stable release was rechecked on 2026-11-17. A local production Docker build, `nginx -t`, and `scripts/verify-nginx.mjs` passed for health, all seven routes, redirects, cache and conditional responses, missing resources, and WASM/font/JS/CSS MIME types. Production rollout and version verification remain pending.

Evidence: [Dockerfile:24](Dockerfile#L24) selects `FROM nginx:1.27-alpine AS production`. An ordinary production GET returned HTTP 200 with `server: nginx/1.27.5` on 2026-11-16. A server header is supporting evidence, not a container inventory.

Impact: several published nginx advisory ranges include 1.27.5. Exposure depends on enabled modules and configuration, so the version match alone does not establish an exploitable path. The checked configuration serves static files on port 80 behind Traefik; advisories requiring nginx TLS termination, HTTP/3, or unused modules need separate applicability checks. No working exploit was established. See the [nginx security advisories](https://nginx.org/en/security_advisories.html).

Recommendation: upgrade the production base to `nginx:1.30.6-alpine`, the target selected in the approved audit. The [upstream release page](https://nginx.org/en/download.html) currently lists 1.30.6 as stable. Recheck the release and image availability when implementing the upgrade. Rebuild and redeploy the image, then verify nginx configuration, health checks, prerendered routes, missing-file responses, cache behavior, and WASM content types. Hiding the version header would not replace the upgrade.

### SEC-002: Browser security headers are missing

Local implementation: the postbuild generator in `scripts/security-headers.mjs` scans all emitted HTML and writes a private nginx include. All 28 executable inline scripts across nine built documents are covered by ten unique hashes. The policy restricts scripts, workers, connections, images, fonts, framing, objects, forms, and base URLs. Only WASM evaluation is permitted. Required React styles and the small Vite-inlined font subset are allowed. nginx merges inherited headers and sends them with `always`. Generator tests, HTTP header checks, and Chromium exercises passed in report-only and enforced modes for themes, navigation, previews, five output codecs, downloads, and batch ZIPs. Direct document checks found no CSP violations; `/settings` has an existing React hydration warning when server/client hardware concurrency differs. Production edge/header verification remains pending.

Rule references: `REACT-CSP-001` and `JS-CSP-001`.

Evidence: the server block at [comprimage.conf:4](docker/nginx/comprimage.conf#L4) sets no CSP, framing restriction, `X-Content-Type-Options`, or explicit referrer policy. The sampled production response also omitted `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy`. This confirms the observation for that response, not every edge response or route.

Impact: the browser lacks these additional protections against script injection, unwanted framing, MIME confusion, and unnecessary referrer disclosure. This is a hardening gap; no exploitable XSS path was found. The inline theme script at [__root.tsx:98](src/routes/__root.tsx#L98) is a fixed source string, rather than attacker-supplied markup.

Recommendation: add a header-delivered CSP with restrictive script sources, `frame-ancestors 'none'`, and `object-src 'none'`. Add `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and a deliberate referrer policy such as `strict-origin-when-cross-origin`, assuming embedding is not required.

Derive the complete CSP from production output before enforcing it:

- Account for every executable inline script in every prerendered document, including theme initialization and framework hydration. Hash the emitted script contents during the build, or externalize scripts where compatible. Hashing only the theme script is insufficient.
- Preserve same-origin module workers, lazy codec fetches, and WASM execution. Prefer the narrower `'wasm-unsafe-eval'` permission if needed, rather than allowing general JavaScript evaluation.
- Permit blob image previews and required local assets through the appropriate directives. Inspect any other required blob or data URLs before allowing them.
- Exercise image import, resize, compression, format conversion, batch work, downloads, and theme initialization under a report-only policy before enforcement. Keep image data in the browser.

The [CSP script-src reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src) describes script hashes and WASM permissions. nginx's [header documentation](https://nginx.org/en/docs/http/ngx_http_headers_module.html) explains that location-level `add_header` declarations normally replace inherited declarations. Several current locations set cache headers, for example [comprimage.conf:45](docker/nginx/comprimage.conf#L45). Preserve security headers in those locations and on error responses, using `always` where appropriate. Verify successful, redirect, asset, and error responses after deployment.

### SEC-003: Deployment does not verify the SSH host fingerprint

Local implementation: `.github/workflows/deploy.yml` rejects missing or malformed `SSH_HOST_FINGERPRINT` values before starting SSH and passes the secret to the action. README documents trusted fingerprint collection and rotation. An isolated local OpenSSH server and the action's drone-ssh 1.8.2 client accepted the correct fingerprint and rejected an incorrect fingerprint; the workflow guard rejected missing, malformed, and newline-containing values. GitHub secret configuration and production deployment remain pending.

Evidence: the SSH action at [deploy.yml:40](.github/workflows/deploy.yml#L40) receives `host`, `username`, and `key`, but no `fingerprint` input.

Impact: a network attacker who can redirect the SSH connection could impersonate the deployment host, receive the deployment command, and falsely report success. Private-key authentication identifies the client; it does not by itself establish that the client reached the intended server. This finding does not imply that the private key is transmitted to the server or has leaked.

Recommendation: obtain the server's SHA256 host fingerprint through a trusted channel, such as an authenticated provider console or an already verified administrative connection. Store the verified value as a GitHub Actions secret and pass it to the action's `fingerprint` input. Do not trust a fresh fingerprint collected solely over the same unverified connection. See the [action's host verification documentation](https://github.com/appleboy/ssh-action#host-fingerprint-verification).

Validate that deployment accepts the correct fingerprint and rejects a deliberately incorrect value in an isolated workflow or test environment. The real host fingerprint was not available to this audit, and no deployment was attempted.

## Low-priority findings

### SEC-004: Image processing can exhaust or stall the visitor's tab

Local import implementation: centralized limits retain the 50 MiB file cap and add 25 MP per image/output, 50 loaded batch images, 100 MP per batch, and two concurrent imports. `image-dimensions@2.6.0` checks detected formats and dimensions before decode and capacity reservation. Decoded dimensions are rechecked, temporary bitmaps are closed, partial failures retain valid files in selection order, and cancellation releases unclaimed previews. Dropzone, tool help, and batch FAQ describe the limits. Focused tests and Chromium checks passed for malformed/oversized files, supported formats, exact boundaries, repeated additions, partial imports, cancellation, concurrency, and cleanup. Browser checks confirmed an oversized metadata fixture never reached decoding and repeated additions stopped at 50 images. Production rollout remains pending.

Local worker implementation: the pool now settles worker errors, message errors, dispatch exceptions, cancellations, and five-minute timeouts measured from dispatch. Failed workers are terminated and replaced according to the current pool size, with no automatic image-task retries. Task settlement clears timers and abort listeners; mismatched and late responses are ignored. Hooks cancel obsolete work on option changes, removal, clearing, and unmounting, and adding batch sources does not duplicate active work. Main-thread fallback is serialized and discards late output after cancellation. Focused pool/hook tests and local Chromium checks passed, including crash recovery and cancellation during active batch work.

Evidence: [Dropzone.tsx:50](src/components/upload/Dropzone.tsx#L50) decodes the accepted batch with `Promise.all(files.map((f) => createSourceImage(f)))`. There is no batch-count or total decoded-pixel budget. The existing 50 MiB per-file cap at [source.ts:13](src/lib/source.ts#L13) limits compressed input size, not decoded memory. [source.ts:17](src/lib/source.ts#L17) decodes before reading dimensions.

The pool's `spawn()` at [image-pool.ts:53](src/workers/image-pool.ts#L53) registers a `message` listener without `error` or `messageerror` recovery. Tasks dispatched at [image-pool.ts:146](src/workers/image-pool.ts#L146) have no timeout. The approved audit records that a mocked worker error left its task pending; that experiment was not rerun during report preparation.

Impact: a visitor who selects a large batch or a highly compressed, large-dimension image can exhaust memory. A worker crash can leave processing unresolved. These are browser availability risks requiring local file selection, not evidence of a remote server denial of service.

Recommendation: bound import concurrency and batch size, enforce per-image and aggregate pixel budgets, and reject oversized dimensions as early as feasible. Checking dimensions only after full decoding cannot prevent the first allocation. Add cancellation with cleanup of partially created previews, task timeouts, worker error handling, and replacement of failed workers. Preserve the existing browser fallback behavior.

Validate oversized dimensions, large batches, partial import failures, cancellation, worker crashes, message failures, and timeouts with controlled fixtures and mocked workers. Confirm every task settles and object URLs are released.

### SEC-005: CI supply-chain protections need improvement

Local implementation: all workflow actions are pinned to full commit SHAs, with reviewed upstream release refs, action metadata/entrypoints, release comments, and weekly GitHub Actions Dependabot updates. Workflow permissions are `contents: read`; only publishing has `packages: write`. Pull requests and main pushes run frozen Bun 1.4.4 installation, tests, lint, formatting, production build, and unfiltered `bun audit`. Publishing requires validation success and a main push. Every advisory severity across application and development dependencies blocks publishing; there are no exceptions. actionlint, workflow structure assertions, and all local validation commands passed. An isolated low-severity development-dependency advisory produced audit exit code 1. The project audit found no advisories across 482 checked packages. GitHub-hosted workflow execution, registry publishing, and production deployment remain pending.

Evidence: [deploy.yml:15](.github/workflows/deploy.yml#L15), [deploy.yml:17](.github/workflows/deploy.yml#L17), [deploy.yml:19](.github/workflows/deploy.yml#L19), [deploy.yml:25](.github/workflows/deploy.yml#L25), and [deploy.yml:40](.github/workflows/deploy.yml#L40) reference actions by mutable major tags. Workflow-level `packages: write` at [deploy.yml:9](.github/workflows/deploy.yml#L9) also applies to the deployment job, which does not publish packages. The publishing workflow has no test or dependency-audit gate. The Dockerfile does run the production build and SEO verifier, so publishing is not entirely unchecked.

Impact: a compromised or moved action tag could change code executed in CI. Broad token permissions increase the consequences of a compromised deployment step. Without quality and advisory gates, publishing can proceed with failing tests or known vulnerable dependencies.

Recommendation: pin reviewed actions to full commit SHAs and maintain those pins. Keep workflow permissions at `contents: read` and grant `packages: write` only to the image-publishing job. Gate publishing on tests, lint, formatting, and a dependency audit under an explicit advisory policy. Review action changes and rerun the publishing workflow in a test environment. These controls reduce risk but do not prove all dependencies are safe. See [GitHub's secure-use guidance](https://docs.github.com/en/actions/reference/security/secure-use).

## Rate-limit assessment

The labels at [docker-compose.yml:37](docker-compose.yml#L37) configure `average=100`, `burst=200`, and attach the middleware to the hostname's router. With the documented default `period=1s`, this is a sustained rate of 100 requests per second per source IP, with an instantaneous burst capacity of 200. It is a token bucket, not a strict 100-request ceiling in each calendar second. The defaults and grouping were checked against [Traefik's rate-limit documentation](https://doc.traefik.io/traefik/reference/routing-configuration/http/middlewares/ratelimit/) through Context7.

Keep the thresholds pending traffic measurements and make `period=1s` explicit in a follow-up. The confirmed direct-to-Traefik topology suits the default connection-IP grouping. There is no reason to switch grouping to client-supplied forwarded headers. Reassess trusted proxy handling if that topology changes.

The middleware covers documents and static assets, including codec downloads. It does not govern local image processing. Limits use each Traefik instance's memory unless shared storage is configured; none is configured in this repository. The shared Traefik installation was not inspected. IP rotation can evade per-IP limits, while visitors behind shared NAT compete for one allowance. Request frequency also does not bound concurrent requests or download bandwidth.

Production received ordinary requests only. Test burst rejection and recovery in an isolated environment: exceed an initially full bucket, observe 429 responses, allow token refill, and confirm successful requests resume. Include realistic page and asset loading when evaluating thresholds.

## Package upgrade assessment

`bun audit` found no known vulnerabilities among 481 packages. `bun outdated` returned the following major-version upgrades on 2026-11-16:

| Package        | Installed | Latest |
| -------------- | --------- | ------ |
| lucide-react   | 0.577.0   | 1.73.0 |
| react-dropzone | 15.0.0    | 20.2.0 |
| @types/node    | 22.20.5   | 26.6.6 |
| jsdom          | 28.1.0    | 31.0.1 |
| typescript     | 6.0.3     | 7.0.2  |
| vitest         | 4.1.12    | 5.1.0  |

Treat these as compatibility migrations rather than advisory-driven fixes. Defer TypeScript 7: the installed `@typescript-eslint/typescript-estree` parser declares support for `>=4.8.4 <6.1.0` in `dist/parseSettings/warnAboutTSVersion.js:47`. Upgrade parser support before moving outside that range. Recheck registry versions and advisories when scheduling migrations. The immediate security upgrade is the nginx image.

## Verification and limitations

The approved audit reported 29 passing tests, ESLint and Prettier success, and valid production Compose configuration. Report preparation reconfirmed the package audit, outdated-package inventory, parser support range, production Compose validity with `docker compose --profile prod config --quiet`, and the ordinary production response described above. The report checkpoint requires `bunx prettier --check security_best_practices_report.md` and a diff review. Repository tests, lint, and formatting are also rerun before handoff.

The review did not establish a working exploit, exhaustively test browser codecs, load-test production, inventory all container OS vulnerabilities, inspect the host deployment script, or verify the shared Traefik version and host configuration. Header observations cover a sample response. Advisory and registry results are time-sensitive. Recommended fixes require their own implementation and verification; this checkpoint delivers the audit report.
