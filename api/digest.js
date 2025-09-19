const { runAgent } = require('../src/pipeline/runAgent');

function parseRequestBody(req) {
  if (req.body) return req.body;
  try {
    return JSON.parse(req.rawBody || '{}');
  } catch (error) {
    return {};
  }
}

function extractUrls(payload) {
  if (!payload) return [];
  if (Array.isArray(payload.urls)) return payload.urls;
  if (typeof payload.urls === 'string') {
    return payload.urls
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return [];
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const payload = parseRequestBody(req);
  const urls = extractUrls(payload);
  if (urls.length === 0) {
    res.status(400).json({ error: 'Provide at least one URL via the `urls` array or newline string.' });
    return;
  }

  try {
    const disableBrowser = process.env.DISABLE_PLAYWRIGHT === '1';
    const { records, metadata, durationMs } = await runAgent(urls, {
      writeArtifacts: false,
      disableBrowser,
    });

    res.status(200).json({ metadata, records, durationMs });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Digest run failed' });
  }
};
