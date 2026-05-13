// ====== 設定區域 ======
// 使用 allorigins 代理，並連結至最穩定的 YouBike 2.0 來源（含新北站點）
const API_URL = "https://api.allorigins.win/get?url=" + encodeURIComponent("https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json");

// 建議使用純站名，過濾時會比較準確
const FAVORITE_STATIONS = [
  "捷運三重站(1號出口)",
  "捷運三重站(3號出口)",
  "三重重陽公園",
  "二重國小",
  "東海高中"
];

const APP_VERSION = 10;

// ====== 初始化 ======
document.addEventListener("DOMContentLoaded", () => {
  const versionEl = document.getElementById("version");
  if (versionEl) versionEl.innerText = `🚲 app.js 更新版本：第 ${APP_VERSION} 版`;
  fetchData();
  
  // 設定每 60 秒自動更新
  setInterval(fetchData, 60000);
});

// ====== 抓取資料邏輯 ======
async function fetchData() {
  const statusEl = document.getElementById("status");
  statusEl.innerText = "連線中...";

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP 錯誤: ${res.status}`);

    const wrapper = await res.json();
    
    // allorigins 會將內容放在 .contents 中（字串格式）
    if (!wrapper.contents) throw new Error("Proxy 未回傳內容");
    
    const data = JSON.parse(wrapper.contents);

    if (Array.isArray(data)) {
      renderStations(data);
      statusEl.innerText = `最後更新時間：${new Date().toLocaleTimeString()}`;
    } else {
      throw new Error("資料格式非數組");
    }

  } catch (err) {
    console.error("❌ 錯誤詳情:", err);
    statusEl.innerText = "讀取失敗，請確認 API 狀態";
  }
}

// ====== 畫面渲染邏輯 ======
function renderStations(data) {
  const container = document.getElementById("stationList");
  if (!container) return;
  
  container.innerHTML = "";

  // 過濾：檢查 API 的 sna 欄位是否包含我們設定的站名關鍵字
  const filtered = data.filter(s =>
    FAVORITE_STATIONS.some(fav => s.sna.includes(fav))
  );

  if (filtered.length === 0) {
    container.innerHTML = "<div class='card'>找不到指定站點，請確認站名是否正確。</div>";
    return;
  }

  filtered.forEach(station => {
    const bike = parseInt(station.sbi || 0);
    const empty = parseInt(station.bemp || 0);
    // 移除名稱前綴以利閱讀
    const cleanName = station.sna.replace("YouBike2.0_", "");

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="station-name">📍 ${cleanName}</div>
      <div class="info">
        <div class="stat-item ${getBikeColor(bike)}">
          <span class="label">🚲 可借</span>
          <span class="count">${bike}</span>
        </div>
        <div class="stat-item">
          <span class="label">🅿️ 可還</span>
          <span class="count">${empty}</span>
        </div>
      </div>
      <div class="update-time">更新時間: ${station.mday}</div>
    `;
    container.appendChild(card);
  });
}

// ====== 輔助函數：顏色判定 ======
function getBikeColor(bike) {
  if (bike === 0) return "danger";
  if (bike <= 3) return "warning";
  return "good";
}