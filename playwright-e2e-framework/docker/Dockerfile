# Playwright Docker setup for consistent CI/CD execution.
#
# WHY Docker for E2E tests:
# - "Works on my machine" → works EVERYWHERE
# - Same browser versions in CI and local
# - No more "Chrome updated and broke my tests" issues
# - Pinned image version = reproducible results
#
# Usage:
#   docker build -t playwright-tests -f docker/Dockerfile .
#   docker run --rm playwright-tests

FROM mcr.microsoft.com/playwright:v1.49.0-noble

WORKDIR /app

# Copy dependency files first (Docker layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy test code
COPY . .

# Run as non-root user (security best practice)
USER pwuser

CMD ["npx", "playwright", "test"]
