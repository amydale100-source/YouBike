console.log("🚲 app.js 有更新")
// ====== 你要改的地方（API） ======
// 新北 YouBike2.0 API（可能會變動，之後可替換）
const API_URL = "https://data.ntpc.gov.tw/api/datasets/YOUR_DATASET_ID/json";

// ====== 你常用的站點 ======
const FAVORITE_STATIONS = [
  "捷運府中站",
  "板橋車站",
  "捷運新埔站"
];

// ====== 主要流程 ======

async function fetchData() {
  document.getElementById("status").innerText = "更新中...";

  try {
    const res = await fetch("https://data.ntpc.gov.tw/api/datasets/3A8A.../json");
    const data = await res.json();

    renderStations(data);

    document.getElementById("status").innerText = "即時資料";
    document.getElementById("lastUpdate").innerText =
      new Date().toLocaleTimeString();

  } catch (err) {
    console.error(err);
    document.getElementById("status").innerText = "API 讀取失敗";
  }
}

// ====== 過濾 + 顯示 ======

function renderStations(data) {
  const container = document.getElementById("stationList");
  container.innerHTML = "";

  const filtered = data.filter(s =>
    FAVORITE_STATIONS.includes(s.sna)
  );

  filtered.forEach(station => {
    const bike = parseInt(station.sbi || 0);   // 可借
    const empty = parseInt(station.bemp || 0); // 可還

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

// ====== 顏色邏輯 ======

function getColor(bike) {
  if (bike === 0) return "danger";
  if (bike <= 3) return "warning";
  return "good";
}

// ====== 自動更新 ======

fetchData();
setInterval(fetchData, 30000);
