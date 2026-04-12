/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

/**
 * Slack 通知腳本
 * 使用：npx ts-node scripts/slack-notify.ts <type>
 * type: pr | daily | hotfix | build
 */

const WEBHOOK = process.env.SLACK_WEBHOOK_URL!;
const CHANNEL = process.env.SLACK_CHANNEL ?? '#pairmaker-ci';

type NotifyType = 'pr' | 'daily' | 'hotfix' | 'build';

function statusEmoji(s?: string): string {
  if (!s) return ':grey_question:';
  if (s === 'success') return ':white_check_mark:';
  if (s === 'failure') return ':x:';
  if (s === 'cancelled') return ':no_entry:';
  return ':grey_question:';
}

async function send(payload: Record<string, unknown>) {
  if (!WEBHOOK) {
    console.warn('SLACK_WEBHOOK_URL not set, skipping notification');
    return;
  }
  const res = await fetch(WEBHOOK, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Slack webhook error: ${res.status}`);
  console.log('Slack notification sent');
}

// ── PR 通知 ────────────────────────────────────────────────────────────────

async function notifyPR() {
  const status    = process.env.JOB_STATUS    ?? 'unknown';
  const prNumber  = process.env.PR_NUMBER      ?? '?';
  const prTitle   = process.env.PR_TITLE       ?? '';
  const prUrl     = process.env.PR_URL         ?? '';

  await send({
    channel: CHANNEL,
    text:    `${statusEmoji(status)} *PR #${prNumber} CI ${status}*`,
    blocks:  [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${statusEmoji(status)} *PR #${prNumber} — ${prTitle}*\nCI 狀態：\`${status}\`\n<${prUrl}|View PR>`,
      },
    }],
  });
}

// ── Daily 通知 ─────────────────────────────────────────────────────────────

async function notifyDaily() {
  const apiStatus    = process.env.API_STATUS    ?? 'unknown';
  const appiumStatus = process.env.APPIUM_STATUS ?? 'unknown';
  const runId        = process.env.RUN_ID        ?? '';

  await send({
    channel: CHANNEL,
    text:    `📊 PairMaker 每日測試報告`,
    blocks:  [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `📊 *每日測試報告* (Run: \`${runId}\`)`,
          `API Tests:    ${statusEmoji(apiStatus)} \`${apiStatus}\``,
          `Appium Smoke: ${statusEmoji(appiumStatus)} \`${appiumStatus}\``,
        ].join('\n'),
      },
    }],
  });
}

// ── Hotfix 通知 ────────────────────────────────────────────────────────────

async function notifyHotfix() {
  const status = process.env.JOB_STATUS  ?? 'unknown';
  const branch = process.env.BRANCH_NAME ?? '';

  await send({
    channel: CHANNEL,
    text:    `${statusEmoji(status)} Hotfix 推送 ${status}`,
    blocks:  [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${statusEmoji(status)} *Hotfix* \`${branch}\` EAS 更新：\`${status}\``,
      },
    }],
  });
}

// ── Build 通知 ─────────────────────────────────────────────────────────────

async function notifyBuild() {
  const status   = process.env.JOB_STATUS ?? 'unknown';
  const tag      = process.env.TAG_NAME   ?? '';
  const platform = process.env.PLATFORM   ?? 'all';
  const profile  = process.env.PROFILE    ?? 'production';

  await send({
    channel: CHANNEL,
    text:    `${statusEmoji(status)} EAS Build ${tag} (${platform}/${profile}) ${status}`,
    blocks:  [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `${statusEmoji(status)} *EAS Build ${status}*`,
          `Tag: \`${tag}\`  Platform: \`${platform}\`  Profile: \`${profile}\``,
        ].join('\n'),
      },
    }],
  });
}

// ── Main ───────────────────────────────────────────────────────────────────

const type = process.argv[2] as NotifyType;

const handlers: Record<NotifyType, () => Promise<void>> = {
  pr:     notifyPR,
  daily:  notifyDaily,
  hotfix: notifyHotfix,
  build:  notifyBuild,
};

const handler = handlers[type];
if (!handler) {
  console.error(`Unknown notification type: ${type}`);
  console.error('Usage: ts-node slack-notify.ts <pr|daily|hotfix|build>');
  process.exit(1);
}

handler().catch((err) => {
  console.error('slack-notify failed:', err);
  process.exit(1);
});
