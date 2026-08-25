FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates openssh-client ripgrep \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g @openai/codex @anthropic-ai/claude-code

RUN useradd --create-home --uid 10001 agent
USER agent
WORKDIR /workspace/client

CMD ["bash"]
