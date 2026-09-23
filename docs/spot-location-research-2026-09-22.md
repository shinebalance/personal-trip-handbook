# スポットの位置確認と支店選定

確認日：2026-09-22

`mds/spots.md`・`mds/stores.md` の未登録21件に座標を追加。既存9件と合わせ、全30スポットを地図の表示対象にした。`location.sourceUrl` は座標の出典、カード直下の `sourceUrl` は住所・店舗情報の出典。建物内の店舗は建物位置を使い、階数は住所に残している。

## 支店の選び方

距離は登録した緯度・経度から計算した概算の直線距離。徒歩経路の距離や所要時間ではない。

| 候補 | 採用した場所 | 既存スポットとの組み合わせ |
| --- | --- | --- |
| Fritz Coffee | 苑西店（원서점） | 教保文庫 光化門店から約1.2km。光化門から安国方面へ歩く組み合わせ。ユーザーが苑西店を選択済み。 |
| CHAGEE | 龍山アイパークモール店 | イーマート龍山店と同じ建物の6階。電気街の買い物と同日に寄る。元の `CHANGEE` 表記は公式の `CHAGEE` に修正、IDは維持。 |
| MEGA Coffee | 弘大入口駅店 | Figure Friendsから約80m、オリーブヤング弘大タウンから約45m。 |
| オリーブヤング | 弘大タウン | Figure FriendsやMEGA Coffeeと同じ弘大の買い物に組み込む。 |
| HOTTRACKS | 光化門店 | 既存の教保文庫 光化門店と同じ建物の地下1階。 |
| ロッテマート | ソウル駅店を基本候補、蚕室店も維持 | ソウル駅店は明洞の代表位置から約1.5km。蚕室へ行く場合はタワーから約560mの蚕室店。 |
| CU / GS25 | CU弘大サンサン店を代表候補に具体化 | THANKS BOOKSから約300m。コンビニ文化とラーメンライブラリーを一緒に見られる。 |
| Storage Book & Film | 解放村店（新興路115-1） | 2026年更新のソウル観光公式案内に掲載された店舗。電気街から約2.1km離れており、龍山駅周辺の徒歩ついでとはせず別移動を見込む。 |

カフェラリ瑞草店は国際電子センターから約160m。合井・新村・龍山の店舗は元のエリア別リストの組み合わせを維持し、麻谷・江南・蚕室の追加候補にも座標を登録した。

チェーン全体のロッテマート・オリーブヤング・MEGA Coffeeは具体的な支店カードと重複していたため、共通メモを `wishlist.md` の `wish` に移動。48件すべてのIDと既存の関連リンクを保持し、同じ支店の二重登録を避けた。

## 照合時に注意した点

- **YOUR-MIND**：[公式店舗案内](https://www.your-mind.com/yourmind/offline.html)の現在の住所は「연희로 122 경교빌딩 302」。公式ページ内の埋め込み地図の中心は現住所の建物位置と一致しないため、その中心座標は採用せず、[現住所の建物座標](https://en.findby.co.kr/details/03724-114103112019-st-652bee314e0223ae1800f8b7)を[同じ建物1階の店舗地図](https://polle.com/place/2k5oMB/%EC%9D%B4%ED%82%B4)と照合した。外部リンクと地図プレビューも座標指定にして同名の旧店舗検索を避ける。
- **HOTTRACKS**：住所は既存カードの店舗資料と一致。座標は同居する[教保文庫の公式店舗データ](https://store.kyobobook.co.kr/store-info/001)の建物位置を使用。店内の売場位置や入口を示すものではない。近接する教保文庫のピンが重なる縮尺では一覧から選択できる。
- **ロッテマート蚕室店**：[店舗位置](https://www.placeview.co.kr/id/MjAyMDM0MDgg)を[Wazeの店舗ピン](https://www.waze.com/live-map/directions/%EB%A1%AF%EB%8D%B0%EB%A7%88%ED%8A%B8-%EC%9E%A0%EC%8B%A4%EC%A0%90-%EC%84%9C%EC%9A%B8-seoul?to=place.w.83296631.832966311.487703)と照合。広い施設の住所からタワー側にピンを置かないよう、マートの建物位置を採用した。
- **ept 聖水**：[公式の店舗案内](https://eastpacifictrade.com/blogs/journal/seongsu-new-store-opening)にある「연무장17길 4-1」の店舗を採用。[店舗地図](https://www.placeview.co.kr/id/MjEwMjc2MDcyMiAg)と[開店イベントの同住所の位置](https://prezem.site/places/1595/)を照合した。
- **龍山の電気街**：単独店舗ではないので `kind: area` とし、[電気街の掲載位置](https://mapcarta.com/N6607654985)を代表点として明記。
- **カフェラリ瑞草店**：位置は確認できたが、公式の営業案内が未確認という既存の注意書きは維持。

## 追加した座標の出典

座標は各ページの店舗マーカー・店舗データを確認して転記。近くの駅や地図の初期表示中心から推定していない。住所・支店の照合は各カードの住所出典も併用した。座標の確認日は営業中であることを保証する日付ではない。

| スポット | 緯度 | 経度 | 座標の根拠 |
| --- | --- | --- | --- |
| Beluga Music | 37.5567428579938 | 126.929221745125 | [OnTripの店舗マーカー（韓国観光公社由来）](https://ontrip.kr/travel-guides/details/4012527) |
| YOUR-MIND | 37.5684604 | 126.9324382 | [現住所の建物座標](https://en.findby.co.kr/details/03724-114103112019-st-652bee314e0223ae1800f8b7) |
| 国際電子センター | 37.484907 | 127.017857 | [店舗ページのLatitude / Longitude](https://kr.near-place.com/international-electronics-center-304-hyoryeong-ro-seocho-1il-dong-seocho-gu/da) |
| 龍山の電気街 | 37.5337 | 126.96436 | [OSMの電気街代表点](https://mapcarta.com/N6607654985) |
| Storage Book & Film 解放村店 | 37.5447456222048 | 126.983136751452 | [ソウル観光公式の店舗マーカー](https://english.visitseoul.net/itaewon/2024-storage-book-and-film/ENP43to2h) |
| HOTTRACKS 光化門店 | 37.57081936962591 | 126.9778991525692 | [同じ建物の教保文庫公式店舗データ](https://store.kyobobook.co.kr/store-info/001) |
| CU 弘大サンサン店 | 37.5508397 | 126.9200367 | [店舗ページのGeoCoordinates](https://mom-mom.net/travel/places/65d3ff639af6b32c85e83e1e) |
| ept 聖水 | 37.5411272626791 | 127.061329355531 | [店舗マーカー](https://www.placeview.co.kr/id/MjEwMjc2MDcyMiAg) |
| Fritz Coffee Company 苑西店 | 37.577669 | 126.988491 | [店舗ページの緯度・経度](https://www.diningcode.com/profile.php?rid=ZdzXaIMuxpYy) |
| CHAGEE 龍山アイパークモール店 | 37.529441 | 126.965307 | [韓国公式店舗一覧の支店別location](https://chagee.co.kr/kr/ko/stores) |
| 教保文庫 合井店 | 37.5500215 | 126.9123444 | [公式店舗データのlatitude / longitude](https://store.kyobobook.co.kr/store-info/049) |
| イーマート 新村店 | 37.5549944655605 | 126.935997574268 | [公式店舗マーカー](https://eapp.emart.com/branch/view.do?id=1139) |
| MEGA MGC COFFEE 弘大入口駅店 | 37.5562009 | 126.9242422 | [店舗ページのGeoCoordinates](https://www.wowpass.io/ko/community/poi/detail/10978) |
| オリーブヤング 弘大タウン | 37.5566 | 126.9243375 | [店舗ページのgeolocation](https://triple.guide/attractions/781f33a1-f4ac-45e5-a330-b3ca2e840b1c) |
| イーマート 龍山店 | 37.5288942 | 126.9656861 | [公式店舗マーカー](https://eapp.emart.com/branch/view.do?id=1060) |
| ロッテマート ゼタプレックス ソウル駅店 | 37.555782 | 126.970505 | [店舗ページのLatitude / Longitude](https://kr.near-place.com/lotte-mart-seoul-station-426-cheongpa-ro-jung-gu) |
| トゥムセラーメン 明洞本店 | 37.56302611598872 | 126.98597893692475 | [店舗ページのGeoCoordinates](https://www.tabling.co.kr/place/677cc7bc66de5f06987549be) |
| カフェラリ 瑞草店 | 37.484177591263936 | 127.01937632068875 | [店舗ページのGeoCoordinates](https://www.tabling.co.kr/place/677cca9666de5f06987b8e77) |
| ロッテマート ゼタプレックス 蚕室店 | 37.5117013922435 | 127.096471444135 | [店舗マーカー（Wazeと照合）](https://www.placeview.co.kr/id/MjAyMDM0MDgg) |
| トレーダース ホールセールクラブ 麻谷店 | 37.5608751008131 | 126.824695969186 | [公式店舗マーカー](https://eapp.emart.com/branch/view.do?id=2023) |
| 教保文庫 江南店 | 37.5037373 | 127.0240583 | [公式店舗データのlatitude / longitude](https://store.kyobobook.co.kr/store-info/015) |
