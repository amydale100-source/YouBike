import streamlit as st
import requests
import pandas as pd

# --- 參數設定 ---
# 確保名稱與官方資料一致
FAVORITE_STATIONS = ["捷運三重站(1號出口)", "捷運三重站(3號出口)", "三重重陽公園", "二重國小", "東海高中"]

st.set_page_config(page_title="三重單車即時查", page_icon="🚲")

def get_tdx_data():
    """從 TDX 平台抓取新北市 YouBike 資料"""
    # 使用 TDX 的新北市 YouBike 2.0 即時資料 API
    url = "https://tdx.transportdata.tw/api/basic/v2/Bike/Availability/City/NewTaipei?$format=JSON"
    
    # 這裡使用基礎標頭，模擬瀏覽器存取
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"TDX 伺服器回應異常，狀態碼：{response.status_code}")
            return None
    except Exception as e:
        st.error(f"連線至 TDX 失敗：{e}")
        return None

# --- 主介面 ---
st.title("🚲 三重區單車查詢 (TDX 版)")

raw_data = get_tdx_data()

if raw_data:
    # TDX 的欄位名稱與原先 API 略有不同：
    # StationName.Zh_tw: 站點名稱
    # AvailableRentBikes: 可借車數
    # AvailableReturnSlots: 可還車位
    # SrcUpdateTime: 更新時間
    
    # 篩選邏輯
    display_list = [
        item for item in raw_data 
        if any(name in item.get('StationName', {}).get('Zh_tw', '') for name in FAVORITE_STATIONS)
    ]

    if display_list:
        for s in display_list:
            full_name = s['StationName']['Zh_tw']
            clean_name = full_name.replace("YouBike2.0_", "")
            
            with st.container():
                st.subheader(f"📍 {clean_name}")
                c1, c2 = st.columns(2)
                c1.metric("🚲 可借車輛", s['AvailableRentBikes'])
                c2.metric("🅿️ 可還空位", s['AvailableReturnSlots'])
                st.caption(f"數據更新時間：{s['SrcUpdateTime']}")
                st.divider()
    else:
        st.warning("找不到指定站點。")
        with st.expander("查看目前可用的站點名稱"):
            names = [item['StationName']['Zh_tw'] for item in raw_data[:10]]
            st.write(names)
else:
    st.info("暫時無法取得 TDX 資料。如果持續失敗，可能需要申請 TDX API Key。")

if st.button("手動更新數據"):
    st.rerun()
