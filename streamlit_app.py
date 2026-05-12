import streamlit as st
import requests
import urllib3

# 關閉 SSL 憑證警告訊息
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# --- 參數設定 ---
# 這些是你指定的常用站點名稱
FAVORITE_STATIONS = ["捷運三重站(1號出口)", "捷運三重站(3號出口)", "三重重陽公園", "二重國小", "東海高中"]

st.set_page_config(page_title="三重區單車查詢", page_icon="🚲")

def get_bike_data():
    """從 API 抓取資料，加入 Headers 偽裝並處理解析錯誤"""
    url = "https://data.ntpc.gov.tw/api/datasets/0121e312-705a-4933-a6ef-9883f3603408/json?size=2000"
    
    # 模擬一般 Chrome 瀏覽器的請求標頭
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    }
    
    try:
        # verify=False 解決 SSL 問題，timeout 防止程式卡死
        response = requests.get(url, headers=headers, verify=False, timeout=15)
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"伺服器回應異常，狀態碼：{response.status_code}")
            return None
    except Exception as e:
        st.error(f"連線失敗：{e}")
        return None

# --- 主介面 ---
st.title("🚲 三重區常用站點查詢")

with st.spinner('正在獲取最新數據...'):
    raw_data = get_bike_data()

if raw_data:
    # 篩選邏輯：檢查站點名稱是否包含在我們定義的清單中
    display_data = [
        item for item in raw_data 
        if any(station in item['sna'] for station in FAVORITE_STATIONS)
    ]

    if display_data:
        # 依照你的清單順序排序顯示
        for fav_name in FAVORITE_STATIONS:
            # 從資料中找出對應的站點
            match = next((s for s in display_data if fav_name in s['sna']), None)
            if match:
                with st.container():
                    # 移除名稱前綴
                    clean_name = match['sna'].replace("YouBike2.0_", "")
                    st.subheader(f"📍 {clean_name}")
                    
                    c1, c2 = st.columns(2)
                    # sbi: 可借車數, bemp: 可還車位
                    c1.metric("🚲 可借車輛", match['sbi'])
                    c2.metric("🅿️ 可還空位", match['bemp'])
                    
                    st.caption(f"數據更新時間：{match['mday']}")
                    st.divider()
    else:
        st.warning("在 API 中找不到指定的站點，請確認名稱是否精確。")
else:
    st.info("暫時無法取得即時資料，請稍後重試。")

if st.button("手動重新整理"):
    st.rerun()
