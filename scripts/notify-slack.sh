#!/usr/bin/env bash
#
# Posts one message to Slack when CI fails on a branch that deploys, so the
# team knows why a deploy is held back. Called from the workflow's
# `notify-failure` job, which runs only when an earlier job failed on a push
# (pull requests and passing runs send nothing). Deploy results themselves come
# from the Vercel Slack app and a Railway webhook.
#
# Environment (set by the job):
#   NEEDS_JSON              toJSON(needs): which jobs failed
#   GH_TOKEN                github.token, to read when the run started
#   SLACK_WEBHOOK_URL       secret: staging and every other branch
#   SLACK_WEBHOOK_URL_PROD  secret, optional: main (production); else the above
#   SLACK_WEBHOOK_URL_TEST  secret: used, and only it, when NOTIFY_TEST=1
#   NOTIFY_TEST             "1" for a test message (manual workflow run)
#
# A notification must never fail CI: every path ends in exit 0, and the HTTP
# call is followed by `|| echo "Slack notify failed"`. The webhook is never
# printed: it travels in the environment and the call's stderr is dropped.

set -u

BRANCH="${GITHUB_REF_NAME:-}"
case "$BRANCH" in
  main) ENV_LABEL="Production" ;;
  release/staging-v1) ENV_LABEL="Staging" ;;
  *) ENV_LABEL="" ;;
esac

# ---- webhook ----------------------------------------------------------------
if [ "${NOTIFY_TEST:-}" = "1" ]; then
  WEBHOOK="${SLACK_WEBHOOK_URL_TEST:-}"
elif [ "$BRANCH" = "main" ] && [ -n "${SLACK_WEBHOOK_URL_PROD:-}" ]; then
  WEBHOOK="$SLACK_WEBHOOK_URL_PROD"
else
  WEBHOOK="${SLACK_WEBHOOK_URL:-}"
fi
if [ -z "$WEBHOOK" ]; then
  echo "Slack notify skipped: no webhook secret is set for this run."
  exit 0
fi

# ---- which job failed -------------------------------------------------------
FAILED="$(printf '%s' "${NEEDS_JSON:-{\}}" | jq -r '[to_entries[] | select(.value.result == "failure") | .key] | join(", ")' 2>/dev/null)"
# In a test run, say what the jobs actually did (a test still posts when one failed).
if [ "${NOTIFY_TEST:-}" = "1" ]; then
  if [ -n "$FAILED" ]; then FAILED="failed at ${FAILED}"; else FAILED="all jobs passed"; fi
fi
[ -n "$FAILED" ] || FAILED="CI"

# ---- message ----------------------------------------------------------------
if [ "${NOTIFY_TEST:-}" = "1" ]; then
  HEADLINE="🧪  Test message: Slack notifications work"
elif [ -n "$ENV_LABEL" ]; then
  HEADLINE="❌  ${ENV_LABEL} deploy blocked (CI failed at ${FAILED})"
else
  HEADLINE="❌  ${BRANCH:-Build} failed at ${FAILED}"
fi

REPO="${GITHUB_REPOSITORY:-}"
SERVER="${GITHUB_SERVER_URL:-https://github.com}"
SHA="${GITHUB_SHA:-}"
SHORT="${SHA:0:7}"
AUTHOR="$(git log -1 --format='%an' "$SHA" 2>/dev/null || true)"
[ -n "$AUTHOR" ] || AUTHOR="${GITHUB_ACTOR:-unknown author}"

# How long the run has taken, from when GitHub started it.
DURATION="n/a"
STARTED="$(gh api "repos/${REPO}/actions/runs/${GITHUB_RUN_ID:-0}" --jq .run_started_at 2>/dev/null || true)"
if [ -n "$STARTED" ]; then
  START_S="$(date -d "$STARTED" +%s 2>/dev/null || true)"
  if [ -n "$START_S" ]; then
    SECS=$(( $(date +%s) - START_S ))
    DURATION="$((SECS / 60))m $((SECS % 60))s"
  fi
fi

RUN_URL="${SERVER}/${REPO}/actions/runs/${GITHUB_RUN_ID:-}"
TEXT="${HEADLINE}
${REPO#*/} · <${SERVER}/${REPO}/commit/${SHA}|${SHORT}> · ${AUTHOR}
${GITHUB_WORKFLOW:-CI}: ${FAILED} · ${DURATION}
<${RUN_URL}|Run #${GITHUB_RUN_NUMBER:-?}>"

PAYLOAD="$(jq -n --arg text "$TEXT" '{text: $text}')"

# ---- send -------------------------------------------------------------------
# stderr is dropped: an HTTP error message could otherwise echo part of the URL.
export NOTIFY_WEBHOOK="$WEBHOOK"
curl -fsS -m 15 -X POST -H 'Content-Type: application/json' --data "$PAYLOAD" "$NOTIFY_WEBHOOK" >/dev/null 2>&1 \
  && echo "Slack notified: ${HEADLINE}" \
  || echo "Slack notify failed"
exit 0
