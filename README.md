# PairMaker

## 簡介
一款以「條件篩選 + AI 外貌比對」為核心的交友 App。
用戶可透過詳細條件篩選理想對象，並上傳偏好外貌照片，
由 AI 分析特徵後推薦相似對象。配對成功後進入伴侶模式，
提供約會地點推薦、感情溫度計、共同日記等功能。

## 功能特色
- 🔍 15+ 條件精準篩選（年齡/身高/收入/學歷/種族/性傾向等）
- 🤖 AI 外貌照片比對（上傳偏好照片，AI 推薦相似對象）
- 🗺️ 約會地點地圖推薦（10 種類型，AI 個人化推薦理由）
- 💑 伴侶模式（感情溫度計、約會計畫、紀念日、共同日記）
- ⭐ 點數任務系統（每日任務 + 感情溫度計任務）

## 下載試用（Android）

[📥 下載最新 Android 試用版 APK](https://github.com/dragondaddy2021/PairMaker/releases/latest)

**安裝步驟：**
1. 點擊上方下載連結
2. 下載完成後點開 APK 檔案
3. 若出現「允許安裝未知來源」請點允許
4. 安裝完成後開啟 PairMaker

> ⚠️ 注意：目前為 Demo 試用版，用戶資料為測試假資料

## iOS 試用
目前 iOS 版本尚在準備中，敬請期待。

## 使用說明

### 交友模式
1. 設定篩選條件（性別、年齡、身高、收入、種族等）
2. 上傳偏好外貌照片（可選）
3. 點擊「開始配對」查看符合條件的對象
4. 點擊對象卡片查看詳細資料
5. 點擊「💑 確認交往」進入伴侶模式

### 伴侶模式
1. 查看感情溫度計與共同回憶
2. 建立約會計畫
3. 記錄紀念日
4. 撰寫共同日記
5. 完成任務獲得點數，提升感情溫度

### 地圖功能
1. 點擊底部導覽「地圖」
2. 選擇地點類型（餐廳/咖啡廳/展覽/公園等）
3. 點擊地圖標記查看 AI 推薦理由
4. 點擊「導航前往」開啟地圖導航

## 技術架構
- **前端**：React Native + Expo
- **AI 分析**：Claude API（claude-sonnet-4-20250514）
- **地圖**：Google Maps + Places API
- **狀態管理**：Zustand
- **打包**：EAS Build

## 回報問題 / 商務合作
回報問題或商務合作請洽：dragondaddy2021@gmail.com

## License
MIT License © 2026 Dragon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
