const fs = require('fs');
const { OUTPUT_FILES } = require('../config/defaults');
const { logInfo } = require('../utils/logger');

function writeFileSafe(path, content) {
  fs.writeFileSync(path, content, 'utf-8');
  logInfo('Wrote file', { path });
}

function writeArtifacts({ markdown, links, json }) {
  if (markdown) writeFileSafe(OUTPUT_FILES.markdown, markdown);
  if (links) writeFileSafe(OUTPUT_FILES.links, links);
  if (json) writeFileSafe(OUTPUT_FILES.json, JSON.stringify(json, null, 2));
}

module.exports = { writeArtifacts };
