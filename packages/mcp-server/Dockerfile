# Builds and runs the HTTP transport (src/http.ts) as a standalone container.
# The stdio server (bin/html-library-mcp.mjs) is not what this image runs —
# that one is meant to be launched by an MCP client via npx, not deployed.
#
# Built from the REPO ROOT, not this directory, because the package is part of
# an npm workspace and `npm ci` needs the root lockfile and workspace layout to
# resolve correctly:
#
#   docker build -f packages/mcp-server/Dockerfile -t html-library-mcp .
#   docker run -p 8787:8787 html-library-mcp
#
# HTML_LIBRARY_SOURCE defaults to "remote" inside src/http.ts itself, so it is
# not set again here — a deployed container has no repository checkout to
# read, and the registry is fetched over HTTPS instead.

FROM node:22-slim AS build
WORKDIR /app

# Root package.json + lockfile + every workspace's package.json first, so this
# layer only rebuilds when a dependency actually changes rather than on every
# source edit.
COPY package.json package-lock.json ./
COPY packages/mcp-server/package.json packages/mcp-server/package.json
RUN npm ci

# scripts/lib is what packages/mcp-server/scripts/sync-core.mjs vendors from,
# and skills/html-library/references/*.md is what scripts/build-skill.mjs
# reads — both are needed even though only packages/mcp-server ends up in the
# final image.
COPY scripts ./scripts
COPY skills ./skills
COPY registry ./registry
COPY packages/mcp-server ./packages/mcp-server
RUN npm run build:mcp

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/mcp-server/dist ./dist
COPY --from=build /app/packages/mcp-server/bin ./bin
COPY --from=build /app/packages/mcp-server/package.json ./package.json

EXPOSE 8787
CMD ["node", "bin/html-library-mcp-http.mjs"]
