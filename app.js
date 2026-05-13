// ====== API ======
const API_URL =
  "https://corsproxy.io/?https://data.ntpc.gov.tw/api/datasets/010e5b15-3823-4b20-b401-b1cf000550c5/json";
// ====== 你常用的站點 ======
const FAVORITE_STATIONS = [
  "YouBike2.0_下庄市場",
  "板橋車站",
  "捷運新埔站"
];

// ====== 版本 ======
const APP_VERSION = 7;

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
  document.getElementById("status").innerText = "載入中...";

  try {
    const res = await fetch(API_URL);

    console.log("STATUS:", res.status);
    console.log("TYPE:", res.headers.get("content-type"));

    const text = await res.text();

    console.log("RAW (前200字):");
    console.log(text.slice(0, 200));

    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    // 暫時先不要 parse，先確認資料長什麼樣
    document.getElementById("status").innerText = "API 有回應（看console）";

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