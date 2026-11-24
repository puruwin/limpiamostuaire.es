#!/usr/bin/env bash
# Hasta N intentos: Claude implementa la issue y el gate la valida. En el
# segundo intento Claude recibe el final del registro del gate.
# Escribe .noche/resultado: ok | bloqueada | necesita-david
set -uo pipefail

ATTEMPTS=$(node -p "require('./pipeline.config.json').attempts")
MINUTES=$(node -p "require('./pipeline.config.json').claudeTimeoutMinutes")
PROMPT=$(cat scripts/pipeline/prompt.md)

# Claude no recibe el token de GitHub: no puede hacer push, ni fusionar, ni
# tocar issues. Solo la clave de Anthropic que necesita para funcionar.
claude_run() {
  env -u GH_TOKEN -u GITHUB_TOKEN -u ACTIONS_RUNTIME_TOKEN -u ACTIONS_ID_TOKEN_REQUEST_TOKEN \
    timeout "${MINUTES}m" npx -y @anthropic-ai/claude-code@"${CLAUDE_CODE_VERSION}" -p "$1" \
      --permission-mode dontAsk \
      --allowedTools Read Edit Write Glob Grep TodoWrite \
        "Bash(npm:*)" "Bash(npx:*)" "Bash(node:*)" "Bash(ls:*)" "Bash(cat:*)" "Bash(mkdir:*)" \
        "Bash(mv:*)" "Bash(cp:*)" "Bash(rm:*)" "Bash(git status:*)" "Bash(git diff:*)" "Bash(git checkout:*)" \
        "Bash(git restore:*)" "Bash(git log:*)" "Bash(grep:*)" "Bash(find:*)" \
      ${CLAUDE_MODEL:+--model "$CLAUDE_MODEL"} \
      ${CLAUDE_MAX_BUDGET_USD:+--max-budget-usd "$CLAUDE_MAX_BUDGET_USD"} \
      --output-format json > ".noche/claude-$2.json"
  local status=$?
  node -e "const fs=require('fs');const r=require('./.noche/claude-$2.json');console.log('Claude:',r.subtype??'', 'coste', r.total_cost_usd??'?','USD,', r.num_turns??'?','turnos');const prev=Number(fs.existsSync('.noche/coste')?fs.readFileSync('.noche/coste','utf8'):0);fs.writeFileSync('.noche/coste',String(prev+(r.total_cost_usd??0)))" 2>/dev/null || true
  return $status
}

for i in $(seq 1 "$ATTEMPTS"); do
  echo "::group::Intento $i: Claude"
  if [ "$i" = 1 ]; then
    claude_run "$PROMPT" "$i"
  else
    claude_run "$PROMPT

Es el intento $i. En el anterior el gate falló. Este es el final del registro (.noche/gate.log):

\`\`\`
$(tail -c 12000 .noche/gate.log)
\`\`\`

Corrige la causa. Tus cambios anteriores siguen en el árbol de trabajo." "$i"
  fi
  echo "Claude salió con $?"
  echo "::endgroup::"

  # Límite de uso de la suscripción (Pro: ventana de 5 h y tope semanal). No es
  # culpa de la issue: se para sin etiquetarla y el cron reintenta.
  if node -e "const r=require('./.noche/claude-$i.json');process.exit(r.is_error&&/limit|quota|rate|429|overloaded/i.test(String(r.result))?0:1)" 2>/dev/null; then
    echo limite > .noche/resultado
    exit 0
  fi

  if [ -s .noche/BLOQUEADA ]; then
    echo necesita-david > .noche/resultado
    exit 0
  fi

  echo "::group::Intento $i: gate"
  if node scripts/pipeline/gate.mjs; then
    echo "::endgroup::"
    echo ok > .noche/resultado
    exit 0
  fi
  echo "::endgroup::"
done

echo bloqueada > .noche/resultado
