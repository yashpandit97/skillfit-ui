import { existsSync, rmSync, writeFileSync } from 'node:fs'

const wranglerJsonc = `{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "skillfit-ui",
  "compatibility_date": "2026-06-29",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  }
}
`

const wranglerToml = `name = "skillfit-ui"
compatibility_date = "2026-06-29"

[assets]
directory = "./dist"
not_found_handling = "single-page-application"
`

writeFileSync('wrangler.jsonc', wranglerJsonc)
writeFileSync('wrangler.toml', wranglerToml)

if (existsSync('.wrangler')) {
  rmSync('.wrangler', { recursive: true, force: true })
}
