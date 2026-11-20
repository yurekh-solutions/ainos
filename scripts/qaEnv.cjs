// Shared credential helper for the six regression suites in this folder
// (_allToolsSmoke, _fullTest, _odooAppsE2E, _toolMarketAudit, _aiEndpoints,
// _saleFlow). Every suite seeds its own throwaway tenant with this password,
// so nothing here needs to be a secret - it must simply never be a literal
// that gets published with the repository.
//
// The suites already run with `node --env-file=.env scripts/<suite>.cjs`, so
// QA_PASSWORD belongs in the git-ignored .env next to DATABASE_URL.
function qaPassword() {
  const value = process.env.QA_PASSWORD;
  if (!value) {
    console.error(
      '[qaEnv] QA_PASSWORD is not set. Add QA_PASSWORD=<any-test-password> to ainos/.env ' +
      'and run the suite as: node --env-file=.env scripts/<suite>.cjs'
    );
    process.exit(1);
  }
  return value;
}

module.exports = { qaPassword };
