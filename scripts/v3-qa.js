const { spawnSync } = require("node:child_process");
const path = require("node:path");

const help = `V3 QA
Usage: npm run v3:qa -- <smoke|wrestling|route /path|all>
No arguments defaults to smoke. --help prints this help.
route: six health checks (360x800, 412x915, 1920x1080; normal + reduced motion).
smoke: existing route smoke spec.
wrestling: current Wrestling route-smoke cases + gateway/Hall/show health.
all: complete existing E2E suite + those generic routes.
Existing specialized tests may expose documented test drift; failures are not suppressed.
Screenshots/traces are retained on failure by the existing Playwright configuration.`;

function validRoute(value) {
  if (typeof value !== "string" || !/^\/(?!\/)/.test(value) || /[\\\s\x00-\x1f]/.test(value)) return false;
  try {
    const decoded = decodeURIComponent(value);
    const url = new URL(value, "http://v3.local");
    return !/[\\\s\x00-\x1f]/.test(decoded) && !decoded.startsWith("//") &&
      !decoded.split(/[/?#]/).some(part => part === "." || part === "..") &&
      url.origin === "http://v3.local";
  } catch { return false; }
}
const args = process.argv.slice(2);
if (args.length === 1 && ["--help", "-h"].includes(args[0])) {
  console.log(help);
} else {
  const mode = args[0] || "smoke";
  if (!["smoke", "wrestling", "route", "all"].includes(mode) ||
      (mode === "route" ? args.length !== 2 || !validRoute(args[1]) : args.length > 1)) {
    console.error("Invalid V3 QA arguments.\n" + help);
    process.exitCode = 2;
  } else {
    const env = { ...process.env };
    delete env.V3_QA_ROUTES;
    const health = "tests/e2e/v3-route-health.spec.js";
    const files = mode === "smoke" ? ["tests/e2e/routes-smoke.spec.js"] :
      mode === "route" ? [health] :
      mode === "wrestling" ? ["tests/e2e/routes-smoke.spec.js", health, "--grep", "core route smoke.* /wrestling|route health"] : [];
    if (mode !== "smoke") env.V3_QA_ROUTES = JSON.stringify(mode === "route" ? [args[1]] :
      ["/wrestling", "/wrestling/shows", "/wrestling/shows/080826"]);
    if (mode === "wrestling" || mode === "all") {
      console.warn(mode === "wrestling"
        ? "Excluded legacy specs: wrestling-people-responsive (retired index/dossier selectors), wrestling-venues-responsive (retired cards/dossier), wrestling-relationship-hooks (retired Ring Archive/show cards and placeholder IDs). Available unchanged via all or test:e2e. Wrestling mode reuses current Wrestling smoke cases; specialized interaction coverage remains migration debt."
        : "All includes legacy Home/Calendar/Wrestling tests with known obsolete assertions. Failures require triage; no tests are suppressed.");
    }
    const start = Date.now();
    const result = spawnSync(process.execPath, [
      require.resolve("@playwright/test/cli"), "test", ...files, "--workers=2",
    ], { cwd: path.resolve(__dirname, ".."), env, stdio: "inherit", shell: false });
    if (result.error) console.error("Unable to start Playwright:", result.error.message);
    const code = result.status ?? (result.signal === "SIGINT" ? 130 : 1);
    console.log(`V3 QA ${mode}: ${code === 0 ? "PASS" : "FAIL"} (${((Date.now() - start) / 1000).toFixed(1)}s), exit ${code}.`);
    process.exitCode = code;
  }
}
