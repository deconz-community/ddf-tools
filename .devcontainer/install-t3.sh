if ! grep -qxF 'export PATH="/home/vp/.local/bin:$PATH"' /home/vp/.bashrc; then
  echo 'export PATH="/home/vp/.local/bin:$PATH"' >> /home/vp/.bashrc
fi

vp install -g @anthropic-ai/claude-code
curl -fsSL https://t3.codes/install.sh | sh

if ! claude auth status >/dev/null; then
  claude auth login --claudeai || exit $?
fi

if ! gh auth status --active --hostname github.com >/dev/null; then
  gh auth login --hostname github.com || exit $?
fi

echo "T3 and Claude Code installation completed."