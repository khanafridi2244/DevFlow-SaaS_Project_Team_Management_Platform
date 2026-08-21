const Anthropic = require("@anthropic-ai/sdk");
const { env } = require("./env");

let client = null;

function getClient() {
  if (client) return client;
  if (!env.anthropic.apiKey) {
    return null; // not configured — AI features will return a clear error instead of crashing
  }
  client = new Anthropic({ apiKey: env.anthropic.apiKey });
  return client;
}

module.exports = { getClient };