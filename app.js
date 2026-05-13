// ====== API ======
const API_URL = "https://data.ntpc.gov.tw/api/datasets/010e5b15-3823-4b20-b401-b1cf000550c5/csv/file";

// ====== 你常用的站點 ======
const FAVORITE_STATIONS = [
  "捷運府中站",
  "板橋車站",
  "捷運新埔站"
];

// ====== 版本 ======
const APP_VERSION = 3;

// ====== DOM ready ======
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("version").innerText =
    `🚲 app.js 更新版本：第 ${APP_VERSION} 版`;
});

// ====== CSV 解析器 ======
function parseCSV(csv) {
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map(line => {
    const values = line.split(",");
    const obj = {};

    headers.forEach((h, i) => {
      obj[h.trim()] = values[i]?.trim();
    });

    return obj;
  });
}

// ====== 抓資料 ======
async function fetchData() {
  document.getElementById("status").innerText = "更新中...";

  try {
    const res = await fetch(API_URL);

    console.log("STATUS:", res.status);
    console.log("OK:", res.ok);

    const text = await res.text();

    console.log("RAW RESPONSE:", text.slice(0, 300));

    if (!res.ok) {
      throw new Error(`HTTP error: ${res.status}`);
    }

    const data = parseCSV(text);

    renderStations(data);

    document.getElementById("status").innerText = "即時資料";
    document.getElementById("lastUpdate").innerText =
      new Date().toLocaleTimeString();

  } catch (err) {
    console.error("❌ FETCH ERROR:", err);
    document.getElementById("status").innerText = "API 讀取失敗";
  }
}

// ====== 顯示資料 ======
function renderStations(data) {
  const container = document.getElementById("stationList");
  container.innerHTML = "";

  const filtered = data.filter(s =>
    FAVORITE_STATIONS.includes(s.sna)
  );

  filtered.forEach(station => {
    const bike = Number(station.sbi || 0);
    const empty = Number(station.bemp || 0);

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="station-name">${station.sna}</div>
      <div class="info">
        <div class="${getColor(bike)}">🚲 可借：${bike}</div>
        <div>🅿️ 可還：${empty}</div>
      </div>
    `;

    container.appendChild(card);
  });
}

// ====== 顏色 ======
function getColor(bike) {
  if (bike === 0) return "danger";
  if (bike <= 3) return "warning";
  return "good";
}

// ====== 自動更新 ======
fetchData();
setInterval(fetchData, 30000);
