/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

/**
 * Jira Bug 自動建立腳本
 * 使用：npx ts-node scripts/jira-bug.ts
 *
 * 環境變數：
 *   JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY
 *   BUG_TITLE, BUG_DESCRIPTION, BUG_PRIORITY, TEST_SUITE, FAILED_TESTS
 */

const JIRA_BASE   = process.env.JIRA_BASE_URL!;
const JIRA_EMAIL  = process.env.JIRA_EMAIL!;
const JIRA_TOKEN  = process.env.JIRA_API_TOKEN!;
const PROJECT_KEY = process.env.JIRA_PROJECT_KEY ?? 'PM';

const authHeader = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64')}`;

interface JiraIssueResponse {
  id:   string;
  key:  string;
  self: string;
}

// ── 判斷優先級 ────────────────────────────────────────────────────────────────

function detectPriority(title: string, desc: string): string {
  const text = `${title} ${desc}`.toLowerCase();
  if (/crash|崩潰|critical|p1|force.?close/.test(text)) return 'Highest';
  if (/error|fail|無法|broken/.test(text))               return 'High';
  return 'Medium';
}

// ── 建立 Jira Issue ───────────────────────────────────────────────────────────

async function createBug(
  title:       string,
  description: string,
  priority?:   string,
  labels:      string[] = [],
): Promise<JiraIssueResponse> {
  const resolvedPriority = priority ?? detectPriority(title, description);

  const payload = {
    fields: {
      project:     { key: PROJECT_KEY },
      summary:     title,
      description: {
        type:    'doc',
        version: 1,
        content: [{
          type:    'paragraph',
          content: [{ type: 'text', text: description }],
        }],
      },
      issuetype: { name: 'Bug' },
      priority:  { name: resolvedPriority },
      labels:    ['automated', 'ci-detected', ...labels],
    },
  };

  const res = await fetch(`${JIRA_BASE}/rest/api/3/issue`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      Accept:          'application/json',
      Authorization:   authHeader,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira create issue failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<JiraIssueResponse>;
}

// ── 從 CI 環境變數建立 Bug ───────────────────────────────────────────────────

async function createFromCI() {
  const title       = process.env.BUG_TITLE       ?? 'Automated CI Bug';
  const description = [
    process.env.BUG_DESCRIPTION ?? '',
    '',
    `**Test Suite:** ${process.env.TEST_SUITE ?? 'unknown'}`,
    `**Failed Tests:**\n${process.env.FAILED_TESTS ?? 'N/A'}`,
    `**CI Run:** ${process.env.GITHUB_RUN_ID ?? process.env.RUN_ID ?? 'N/A'}`,
    `**Branch:** ${process.env.GITHUB_REF_NAME ?? 'unknown'}`,
  ].join('\n').trim();

  const priority = process.env.BUG_PRIORITY;
  const suite    = process.env.TEST_SUITE ?? '';

  const issue = await createBug(title, description, priority, [suite]);

  const issueUrl = `${JIRA_BASE}/browse/${issue.key}`;
  console.log(`✅ Jira Bug created: ${issue.key}`);
  console.log(`   URL: ${issueUrl}`);

  // 同時發 Slack 通知
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (webhook) {
    await fetch(webhook, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        text: `:beetle: *新 Bug 建立*: <${issueUrl}|${issue.key}> — ${title}`,
      }),
    });
  }

  return issue;
}

createFromCI().catch((err) => {
  console.error('jira-bug failed:', err);
  process.exit(1);
});
