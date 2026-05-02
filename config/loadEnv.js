const fs = require('fs');
const path = require('path');

let loaded = false;

const parseEnvLine = (line) => {
  const separatorIndex = line.indexOf('=');
  if (separatorIndex === -1) {
    return null;
  }

  const key = line.slice(0, separatorIndex).trim();
  if (!key || key.startsWith('#')) {
    return null;
  }

  let value = line.slice(separatorIndex + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
};

const loadEnv = () => {
  if (loaded) {
    return;
  }

  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    loaded = true;
    return;
  }

  const fileContent = fs.readFileSync(envPath, 'utf8');
  const lines = fileContent.split(/\r?\n/);

  for (const line of lines) {
    const parsed = parseEnvLine(line);
    if (!parsed) {
      continue;
    }

    if (process.env[parsed.key] === undefined) {
      process.env[parsed.key] = parsed.value;
    }
  }

  loaded = true;
};

module.exports = loadEnv;
