import { registration } from '../worker/api.mjs';

// Adapt the same SQLite statements used by the Worker to the D1 HTTPS API.
function registrationDatabase() {
  const { CLOUDFLARE_ACCOUNT_ID: account, D1_DATABASE_ID: database, D1_API_TOKEN: token } = process.env;
  if (!account || !database || !token) throw new Error('Missing D1 configuration');
  const url = 'https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(account)
    + '/d1/database/' + encodeURIComponent(database) + '/query';

  function prepare(sql, params = []) {
    async function run() {
      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, params })
      });
      if (!response.ok) throw new Error('D1 request failed');
      const result = await response.json();
      if (!result.success || !result.result?.[0]?.success) throw new Error('D1 query failed');
      return result.result[0];
    }
    return {
      bind: (...values) => prepare(sql, values),
      run,
      first: async () => (await run()).results[0] ?? null
    };
  }
  return { prepare };
}

export default {
  async fetch(request) {
    try {
      return await registration(request, registrationDatabase());
    } catch {
      return Response.json({ error: 'Registration is temporarily unavailable. Please try again.' }, {
        status: 503, headers: { 'Cache-Control': 'no-store' }
      });
    }
  }
};
