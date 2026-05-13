// ====== 設定區域 ======
// 使用不同的代理伺服器試試看，並指向 YouBike 2.0 即時資料
const API_URL = "https://api.allorigins.win/get?url=" + encodeURIComponent("https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json");

const FAVORITE_STATIONS = [
  "下庄市場",
  "板橋車站",
  "捷運新埔站"
];

const APP_VERSION = 9;

// ====== 初始化 ======
document.addEventListener("DOMContentLoaded", () => {
  const versionEl = document.getElementById("version");
  if (versionEl) versionEl.innerText = `🚲 app.js 更新版本：第 ${APP_VERSION} 版`;
  fetchData();
});

// ====== 抓取與處理資料 ======
async function fetchData() {
  const statusEl = document.getElementById("status");
  statusEl.innerText = "連線中...";

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("網路請求失敗");

    const wrapper = await res.json();
    // allorigins 代理會把結果放在 wrapper.contents 中，且是字串格式
    const data = JSON.parse(wrapper.contents);

    console.log("解析後的資料範例:", data[0]);

    renderStations(data);
    statusEl.innerText = `更新於: ${new Date().toLocaleTimeString()}`;

  } catch (err) {
    console.error("❌ 發生錯誤:", err);
    statusEl.innerText = "讀取失敗，請確認網路或 API 狀態";
  }
}

// ====== 顯示資料到網頁 ======
function renderStations(data) {
  const container = document.getElementById("stationList");
  container.innerHTML = "";

  // 過濾邏輯：s.sna 可能包含 "YouBike2.0_"，我們用 includes 來模糊比對
  const filtered = data.filter(s =>
    FAVORITE_STATIONS.some(fav => s.sna.includes(fav))
  );

  if (filtered.length === 0) {
    container.innerHTML = "<p>找不到指定的站點資訊</p>";
    return;
  }

  filtered.forEach(station => {
    // 欄位說明: sbi (可借), bemp (可還), sna (站名)
    const bike = Number(station.sbi || 0);
    const empty = Number(station.bemp || 0);
    const cleanName = station.sna.replace("YouBike2.0_", "");

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="station-name">📍 ${cleanName}</div>
      <div class="info">
        <div class="stat-item ${getColor(bike)}">
          <span class="label">🚲 可借</span>
          <span class="count">${bike}</span>
        </div>
        <div class="stat-item">
          <span class="label">🅿️ 可還</span>
          <span class="count">${empty}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ====== 輔助函數：顏色判定 ======
function getColor(bike) {
  if (bike === 0) return "danger";
  if (bike <= 3) return "warning";
  return "good";
}

// ====== 定時更新 (每 60 秒) ======
setInterval(fetchData, 60000);