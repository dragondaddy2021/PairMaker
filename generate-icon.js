/**
 * PairMaker — App Icon Generator
 * 執行：node generate-icon.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS = path.join(__dirname, 'assets');
if (!fs.existsSync(ASSETS)) fs.mkdirSync(ASSETS);

// ─── SVG 產生器 ───────────────────────────────────────────────────────────────

function makeIconSVG(w, h) {
  // 背景圓角半徑（iOS icon 規格：約 22.5% of size）
  const r = Math.round(w * 0.2237);

  // 安全區域內置中
  // heartSize 固定 280px（在 1024 基準），等比縮放
  const scale = w / 1024;
  const heartSize = 280 * scale;    // 使用者要求：280px 基準
  const fontSize  = 80  * scale;    // 使用者要求：80px 基準

  const cx = w / 2;
  const hx = cx;
  // 心形中心 Y：整體元素（心形高度≈heartSize + 字高）垂直置中
  const totalH = heartSize * 1.1 + fontSize * 1.4;
  const hy = (h - totalH) / 2 + heartSize * 0.55;
  const textY = hy + heartSize * 0.55 + fontSize * 0.9;

  const s = heartSize;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF6B6B"/>
      <stop offset="100%" stop-color="#FF3B30"/>
    </linearGradient>
    <clipPath id="roundRect">
      <rect width="${w}" height="${h}" rx="${r}" ry="${r}"/>
    </clipPath>
  </defs>

  <!-- 背景 -->
  <rect width="${w}" height="${h}" rx="${r}" ry="${r}" fill="url(#bg)"/>

  <!-- 白色心形（使用 path） -->
  <g clip-path="url(#roundRect)">
    <path
      d="M ${hx} ${hy + s * 0.55}
         C ${hx} ${hy + s * 0.55} ${hx - s * 1.05} ${hy + s * 0.1} ${hx - s * 1.05} ${hy - s * 0.22}
         C ${hx - s * 1.05} ${hy - s * 0.65} ${hx - s * 0.6} ${hy - s * 0.85} ${hx} ${hy - s * 0.38}
         C ${hx + s * 0.6} ${hy - s * 0.85} ${hx + s * 1.05} ${hy - s * 0.65} ${hx + s * 1.05} ${hy - s * 0.22}
         C ${hx + s * 1.05} ${hy + s * 0.1} ${hx} ${hy + s * 0.55} ${hx} ${hy + s * 0.55} Z"
      fill="white"
      opacity="0.95"
    />

    <!-- 白色文字 PairMaker -->
    <text
      x="${cx}"
      y="${textY}"
      font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
      font-size="${Math.round(fontSize)}"
      font-weight="800"
      fill="white"
      text-anchor="middle"
      dominant-baseline="middle"
      letter-spacing="${Math.round(w * 0.002)}"
      opacity="0.97"
    >PairMaker</text>
  </g>
</svg>`;
}

function makeSplashSVG(w, h) {
  const cx = w / 2;
  const heartSize = Math.min(w, h) * 0.22;
  const hy = h * 0.40;
  const s = heartSize;
  const hx = cx;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF6B6B"/>
      <stop offset="100%" stop-color="#FF3B30"/>
    </linearGradient>
  </defs>

  <!-- 背景（滿版，無圓角） -->
  <rect width="${w}" height="${h}" fill="url(#bg)"/>

  <!-- 心形 -->
  <path
    d="M ${hx} ${hy + s * 0.55}
       C ${hx} ${hy + s * 0.55} ${hx - s * 1.05} ${hy + s * 0.1} ${hx - s * 1.05} ${hy - s * 0.22}
       C ${hx - s * 1.05} ${hy - s * 0.65} ${hx - s * 0.6} ${hy - s * 0.85} ${hx} ${hy - s * 0.38}
       C ${hx + s * 0.6} ${hy - s * 0.85} ${hx + s * 1.05} ${hy - s * 0.65} ${hx + s * 1.05} ${hy - s * 0.22}
       C ${hx + s * 1.05} ${hy + s * 0.1} ${hx} ${hy + s * 0.55} ${hx} ${hy + s * 0.55} Z"
    fill="white"
    opacity="0.95"
  />

  <!-- 文字 -->
  <text
    x="${cx}"
    y="${h * 0.56}"
    font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
    font-size="${Math.round(Math.min(w, h) * 0.068)}"
    font-weight="800"
    fill="white"
    text-anchor="middle"
    dominant-baseline="middle"
    letter-spacing="2"
    opacity="0.97"
  >PairMaker</text>
</svg>`;
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

async function generate() {
  const tasks = [
    {
      name: 'icon.png (1024×1024)',
      svg: makeIconSVG(1024, 1024),
      out: path.join(ASSETS, 'icon.png'),
      w: 1024, h: 1024,
    },
    {
      name: 'adaptive-icon.png (1024×1024)',
      svg: makeIconSVG(1024, 1024),
      out: path.join(ASSETS, 'adaptive-icon.png'),
      w: 1024, h: 1024,
    },
    {
      name: 'splash.png (1242×2436)',
      svg: makeSplashSVG(1242, 2436),
      out: path.join(ASSETS, 'splash.png'),
      w: 1242, h: 2436,
    },
    {
      name: 'splash-icon.png (512×512，供 app.json splash.image 使用)',
      svg: makeIconSVG(512, 512),
      out: path.join(ASSETS, 'splash-icon.png'),
      w: 512, h: 512,
    },
    {
      name: 'favicon.png (48×48)',
      svg: makeIconSVG(48, 48),
      out: path.join(ASSETS, 'favicon.png'),
      w: 48, h: 48,
    },
  ];

  console.log('\n🎨 PairMaker Icon Generator\n');

  for (const task of tasks) {
    try {
      await sharp(Buffer.from(task.svg))
        .resize(task.w, task.h)
        .png()
        .toFile(task.out);
      console.log(`  ✅ ${task.name}`);
    } catch (err) {
      console.error(`  ❌ ${task.name}: ${err.message}`);
      process.exitCode = 1;
    }
  }

  console.log('\n完成！檔案輸出至 ./assets/\n');
}

generate();
