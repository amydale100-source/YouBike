// ====== TDX 認證設定 ======
const CLIENT_ID = 'amydale100-8925db52-3fb0-4142';
const CLIENT_SECRET = '9fce0770-fea0-4353-891a-f89f37b5c532';

// 你要觀察的站點
const FAVORITE_STATIONS = ["捷運三重站", "三重重陽公園", "二重國小", "東海高中"];

// 確保頁面載入後才執行
window.onload = () => {
    const btn = document.getElementById("refreshBtn");
    if (btn) {
        // 先移除所有舊的監聽器，確保乾淨
        btn.onclick = startUpdate;
        console.log("✅ 系統準備就緒，按鈕已綁定");
    }
};

async function startUpdate() {
    const statusEl = document.getElementById("status");
    const btn = document.getElementById("refreshBtn");
    const container = document.getElementById("stationList");

    if (!container) return;

    try {
        // 1. 介面鎖定
        btn.disabled = true;
        btn.innerText = "讀取中...";
        statusEl.innerText = "🔑 正在取得 TDX 授權...";

        // 2. 取得 Token
        const token = await getTDXToken();

        // 3. 抓取資料 (雙重請求：站點資訊 + 數量)
        statusEl.innerText = "📡 正在連線新北市資料庫...";
        const [stationRes, availabilityRes] = await Promise.all([
            fetch("https://tdx.transportdata.tw/api/basic/v2/Bike/Station/City/NewTaipei?$format=JSON", {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch("https://tdx.transportdata.tw/api/basic/v2/Bike/Availability/City/NewTaipei?$format=JSON", {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const stationData = await stationRes.json();
        const availabilityData = await availabilityRes.json();

        // 4. 合併資料
        const combined = availabilityData.map(avail => {
            const info = stationData.find(s => s.StationID === avail.StationID);
            return {
                ...avail,
                StationName: info ? info.StationName : { Zh_tw: "未知站點" }
            };
        });

        // 5. 過濾站點
        const filtered = combined.filter(item => {
            const name = item.StationName?.Zh_tw || "";
            return FAVORITE_STATIONS.some(fav => name.includes(fav));
        });

        // 6. 渲染畫面
        if (filtered.length === 0) {
            container.innerHTML = `<div class="card">目前找不到符合的站點數據，請確認站名。</div>`;
        } else {
            renderList(filtered, container);
            statusEl.innerText = "✅ 更新成功！";
            const timeEl = document.getElementById("lastUpdate");
            if (timeEl) timeEl.innerText = new Date().toLocaleTimeString();
        }

    } catch (err) {
        console.error("更新過程發生錯誤:", err);
        statusEl.innerText = "❌ 發生錯誤：" + err.message;
    } finally {
        btn.disabled = false;
        btn.innerText = "🚲 現在有車嗎？(點我查詢)";
    }
}

async function getTDXToken() {
    const params = new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': CLIENT_ID.trim(),
        'client_secret': CLIENT_SECRET.trim()
    });

    const res = await fetch("https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token", {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });

    if (!res.ok) throw new Error("授權失敗，請確認 TDX 金鑰狀態");
    const data = await res.json();
    return data.access_token;
}

function renderList(list, container) {
    container.innerHTML = "";
    
    // 排序：依照 FAVORITE_STATIONS 的順序排列
    list.sort((a, b) => {
        const aIdx = FAVORITE_STATIONS.findIndex(f => a.StationName.Zh_tw.includes(f));
        const bIdx = FAVORITE_STATIONS.findIndex(f => b.StationName.Zh_tw.includes(f));
        return aIdx - bIdx;
    });

    list.forEach(item => {
        const name = (item.StationName?.Zh_tw || "未知").replace("YouBike2.0_", "");
        const bike = item.AvailableRentBikes ?? 0;
        
        // --- 核心修正：嘗試所有可能的「空位」欄位名稱 ---
        // 新北市 TDX 標準為 AvailableReturnSlots
        const empty = item.AvailableReturnSlots ?? item.AvailableReturnBikes ?? 0;

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
                    <span class="count">${empty}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}