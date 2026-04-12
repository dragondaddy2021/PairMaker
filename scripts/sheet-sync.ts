/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

/**
 * Google Sheets 測試案例同步腳本
 * 將 Allure XML 報告同步至 Google Sheets
 *
 * 使用：npx ts-node scripts/sheet-sync.ts
 */
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { parseStringPromise } from 'xml2js';

const SHEETS_ID   = process.env.GOOGLE_SHEETS_ID!;
const KEY_PATH    = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH
  ?? './secrets/gcp-sa.json';
const RESULTS_DIR = process.env.RESULTS_DIR ?? './reports';

interface TestResult {
  suite:    string;
  name:     string;
  status:   string;
  duration: number;
  error:    string;
}

// ── 解析 JUnit XML 報告 ───────────────────────────────────────────────────────

async function parseJUnitResults(filePath: string): Promise<TestResult[]> {
  const xml  = fs.readFileSync(filePath, 'utf-8');
  const data = await parseStringPromise(xml);
  const results: TestResult[] = [];

  const suites = data.testsuites?.testsuite ?? [data.testsuite];

  for (const suite of suites ?? []) {
    const suiteName = suite.$.name ?? 'Unknown';
    for (const tc of suite.testcase ?? []) {
      const failure = tc.failure?.[0]?._ ?? tc.error?.[0]?._ ?? '';
      results.push({
        suite:    suiteName,
        name:     tc.$.name,
        status:   failure ? 'FAIL' : 'PASS',
        duration: parseFloat(tc.$.time ?? '0') * 1000,
        error:    failure ? failure.substring(0, 200) : '',
      });
    }
  }
  return results;
}

// ── 讀取所有報告 ──────────────────────────────────────────────────────────────

async function collectResults(): Promise<TestResult[]> {
  const all: TestResult[] = [];
  const files = fs.readdirSync(RESULTS_DIR)
    .filter(f => f.endsWith('.xml'));

  for (const file of files) {
    const results = await parseJUnitResults(path.join(RESULTS_DIR, file));
    all.push(...results);
  }
  return all;
}

// ── 寫入 Google Sheets ────────────────────────────────────────────────────────

async function syncToSheets(results: TestResult[]) {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes:  ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const runDate = new Date().toISOString().substring(0, 19).replace('T', ' ');

  const rows = results.map(r => [
    runDate,
    r.suite,
    r.name,
    r.status,
    r.duration.toFixed(0),
    r.error,
  ]);

  // 追加到「TestResults」分頁
  await sheets.spreadsheets.values.append({
    spreadsheetId:     SHEETS_ID,
    range:             'TestResults!A:F',
    valueInputOption:  'USER_ENTERED',
    requestBody:       { values: rows },
  });

  // 更新「Summary」分頁
  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const rate = results.length > 0 ? ((pass / results.length) * 100).toFixed(1) : '0';

  await sheets.spreadsheets.values.update({
    spreadsheetId:     SHEETS_ID,
    range:             'Summary!A2:F2',
    valueInputOption:  'USER_ENTERED',
    requestBody: {
      values: [[runDate, results.length, pass, fail, `${rate}%`, process.env.RUN_ID ?? '']],
    },
  });

  console.log(`✅ Synced ${results.length} results to Google Sheets (pass: ${pass}, fail: ${fail})`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  try {
    const results = await collectResults();
    if (results.length === 0) {
      console.log('No test results found in', RESULTS_DIR);
      return;
    }
    await syncToSheets(results);
  } catch (err) {
    console.error('sheet-sync failed:', err);
    process.exit(1);
  }
}

main();
