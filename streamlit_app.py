import streamlit as st
import requests
import urllib3

# 關閉 SSL 警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# --- 參數設定 ---
FAVORITE_STATIONS = ["捷運三重站(1號出口)", "捷運三重站(3號出口)", "三重重陽公園", "二重國小", "東海高中"]

st.set_page_config(page_title="三重單車即時查", page_icon="🚲")

def get_bike_data():
    """強化偽裝能力的資料抓取函數"""
    # 嘗試使用另一個常見的開放資料介面網址
    url = "https://data.ntpc.gov.tw/api/datasets/0121e312-705a-4933-a6ef-9883f3603408/json?size=2000"
    
    # 更詳盡的標頭偽裝，模仿真實瀏覽器行為
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://data.ntpc.gov.tw/',
        'Origin': 'https://data.ntpc.gov.tw/'
    }
    
    try:
        # 使用 Session 並設定較長的 timeout
        with requests.Session() as session:
            response = session.get(url, headers=headers, verify=False, timeout=20)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 403 or response.status_code == 504:
                st.error("⚠️ 伺服器防火牆攔截了請求 (403/504)。")
                return None
            else:
                st.error(f"❌ 無法連線，代碼: {response.status_code}")
                return None
    except Exception as e:
        st.error(f"❌ 連線異常: {e}")
        return None

# --- 介面呈現 ---
st.title("🚲 三重區單車查詢")

data = get_bike_data()

if data:
    # 過濾指定站點
    filtered = [s for s in data if any(name in s['sna'] for name in FAVORITE_STATIONS)]
    
    if filtered:
        for s in filtered:
            clean_name = s['sna'].replace("YouBike2.0_", "")
            with st.container():
                st.subheader(f"📍 {clean_name}")
                c1, c2 = st.columns(2)
                c1.metric("🚲 可借車輛", s['sbi'])
                c2.metric("🅿️ 可還空位", s['bemp'])
                st.caption(f"數據更新時間: {s['mday']}")
                st.divider()
    else:
        st.warning("找不到站點，可能是 API 名稱變更。")
else:
    st.info("請稍後再試，或嘗試在不同網路環境下開啟。")

if st.button("手動更新數據"):
    st.rerun()
