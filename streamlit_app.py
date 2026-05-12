import streamlit as st
import requests
import urllib3

# 關閉安全警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# --- 參數設定 ---
FAVORITE_STATIONS = ["捷運三重站(1號出口)", "捷運三重站(3號出口)", "三重重陽公園", "二重國小", "東海高中"]

st.set_page_config(page_title="三重單車即時查", page_icon="🚲")

def get_bike_data():
    """更換 API 來源網址並加強錯誤處理"""
    # 更換為 YouBike 2.0 專屬的另一組 API 網址測試
    url = "https://data.ntpc.gov.tw/api/datasets/71cd87cf-2970-41f8-8327-e8fd9a42516b/json?size=2000"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, verify=False, timeout=15)
        
        if response.status_code == 200:
            try:
                return response.json()
            except:
                st.error("❌ 伺服器有回應，但不是 JSON 格式內容。")
                st.text_area("伺服器回傳內容 (Debug)", response.text[:500])
                return None
        else:
            st.error(f"❌ 伺服器連線失敗，狀態碼: {response.status_code}")
            return None
    except Exception as e:
        st.error(f"❌ 無法連線至政府伺服器: {e}")
        return None

# --- UI 介面 ---
st.title("🚲 三重區單車查詢")

data = get_bike_data()

if data:
    # 篩選站點
    favorites = [
        s for s in data 
        if any(name in s['sna'] for name in FAVORITE_STATIONS)
    ]

    if favorites:
        for s in favorites:
            # 格式化名稱
            clean_name = s['sna'].replace("YouBike2.0_", "")
            with st.container():
                st.subheader(f"📍 {clean_name}")
                c1, c2 = st.columns(2)
                # sbi: 可借, bemp: 可還
                c1.metric("🚲 可借車輛", s['sbi'])
                c2.metric("🅿️ 可還空位", s['bemp'])
                st.caption(f"更新時間: {s['mday']}")
                st.divider()
    else:
        st.warning("⚠️ 找不到指定站點，請確認 API 名稱是否有變。")
        with st.expander("查看目前 API 內的前 5 個站點名稱"):
            st.write([s['sna'] for s in data[:5]])
else:
    st.info("請檢查上方錯誤訊息。這通常是政府 API 伺服器的限制問題，不需要會員。")

if st.button("重新整理"):
    st.rerun()
