// ====== TDX 認證設定 ======
const CLIENT_ID = 'amydale100-8925db52-3fb0-4142';
const CLIENT_SECRET = '9fce0770-fea0-4353-891a-f89f37b5c532';

const FAVORITE_STATIONS = ["捷運三重站(1號出口)", "捷運三重站(3號出口)", "三重重陽公園", "二重國小", "東海高中"];
const APP_VERSION = 24; // 更新版號

document.addEventListener("DOMContentLoaded", () => {
    const verEl = document.getElementById("version");
    if (verEl) verEl.innerText = `🚲 app.js 版本：${APP_VERSION} (樣式優化版)`;
    const btn = document.getElementById("refreshBtn");
    if (btn) btn.addEventListener("click", startUpdate);
});

async function startUpdate() {
    const statusEl = document.getElementById("status");
    const lastUpdateEl = document.getElementById("lastUpdate");
    const btn = document.getElementById("refreshBtn");

    try {
        btn.disabled = true;
        btn.innerText = "讀取中...";
        statusEl.innerText = "🔑 正在取得授權...";
        const token = await getTDXToken();

        statusEl.innerText = "📡 正在同步站點資料...";
        const [stationInfo, availability] = await Promise.all([
            fetchTDX("https://tdx.transportdata.tw/api/basic/v2/Bike/Station/City/NewTaipei?$format=JSON", token),
            fetchTDX("https://tdx.transportdata.tw/api/basic/v2/Bike/Availability/City/NewTaipei?$format=JSON", token)
        ]);

        const combinedData = availability.map(avail => {
            const info = stationInfo.find(s => s.StationID === avail.StationID);
            return {
                ...avail,
                StationName: info ? info.StationName : { Zh_tw: "未知站點" }
            };
        });

        renderStations(combinedData);
        statusEl.innerText = "✅ 更新完成！";
        if (lastUpdateEl) lastUpdateEl.innerText = new Date().toLocaleTimeString();

    } catch (err) {
        console.error(err);
        statusEl.innerText = "❌ 錯誤：" + err.message;
    } finally {
        btn.disabled = false;
        btn.innerText = "🚲 現在有車嗎？(點我查詢)";
    }
}

async function getTDXToken() {
    const authUrl = "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token";
    const body = new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': CLIENT_ID.trim(),
        'client_secret': CLIENT_SECRET.trim()
    });
    const res = await fetch(authUrl, { method: 'POST', body });
    if (!res.ok) throw new Error("授權失敗");
    const data = await res.json();
    return data.access_token;
}

async function fetchTDX(url, token) {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error("API 連線失敗");
    return await res.json();
}

function renderStations(data) {
    // 【重要】這裡要對應你的 CSS ID: bike-list
    const container = document.getElementById("bike-list") || document.getElementById("stationList");
    if (!container) return;
    
    container.innerHTML = "";

    const filtered = data.filter(item => {
        const name = item.StationName?.Zh_tw || "";
        return FAVORITE_STATIONS.some(fav => name.includes(fav));
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="card">找不到符合的站點。</div>`;
        return;
    }

    filtered.forEach(item => {
        const name = item.StationName.Zh_tw.replace("YouBike2.0_", "");
        const bike = item.AvailableRentBikes ?? 0;
        const empty = item.AvailableReturnSlots ?? 0; // TDX 的欄位名
        
        // 根據數量決定狀態顏色 (對應你的 CSS)
        const statusClass = bike === 0 ? 'danger' : (bike < 3 ? 'warning' : 'good');

        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <div class="station-name">📍 ${name}</div>
            <div class="info">
                <div class="stat-item ${statusClass}">
                    <span class="label">🚲 可借</span>
                    <span class="count">${bike}</span>
                </div>
                <div class="stat-item">
                    <span class="label">🅿️ 可還</span>
                    <span class="count" style="color: #636e72;">${empty}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}