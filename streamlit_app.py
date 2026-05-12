import streamlit as st
import requests
import pandas as pd

# --- 可調整變數 ---
# 請在下方清單中輸入你常用的站點名稱（不需包含 "YouBike2.0_"）
FAVORITE_STATIONS = ["捷運三重站(1號出口)", "捷運三重站(3號出口)", "三重重陽公園", "二重國小", "東海高中"]

st.set_page_config(page_title="新北單車即時查", page_icon="🚲")

def get_bike_data():
    # 新北市公共自行車即時資訊 API 網址
    url = "https://data.ntpc.gov.tw/api/datasets/0121e312-705a-4933-a6ef-9883f3603408/json?size=2000"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        st.error(f"無法取得資料: {e}")
        return []

st.title("🚲 我的常用單車站點")

# 抓取資料
raw_data = get_bike_data()

if raw_data:
    # 過濾出使用者定義的常用站點
    # API 中的 'sna' 格式通常為 'YouBike2.0_站點名稱'
    display_list = [
        item for item in raw_data 
        if item['sna'].replace("YouBike2.0_", "") in FAVORITE_STATIONS
    ]

    if not display_list:
        st.warning("找不到指定的常用站點，請檢查名稱是否正確。")
    
    # 顯示資訊卡片
    for station in display_list:
        clean_name = station['sna'].replace("YouBike2.0_", "")
        with st.expander(f"📍 {clean_name}", expanded=True):
            col1, col2 = st.columns(2)
            with col1:
                st.metric(label="可借車數", value=station['sbi'])
            with col2:
                st.metric(label="可還車位", value=station['bemp'])
            st.caption(f"最後更新時間：{station['mday']}")

    if st.button('手動更新資料'):
        st.rerun()
else:
    st.info("目前沒有可用資料。")