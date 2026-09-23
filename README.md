# Seoul notes.

薄いグリーンとやわらかな陰影でまとめた、自分用の韓国旅行しおり。React + TypeScript + Viteで静的サイトを生成し、GitHub Pagesに配置します。日本語・한국어・Englishを切り替えられます。

## ローカルで開く

Node.js 22.12以降（`.nvmrc` は22）を使用します。

```sh
npm ci
npm run dev
```

表示されたlocalhostのURLを開きます。`mds/` の追加・編集・削除は開発中も反映されます。

```sh
npm test
npm run build
npm run preview
```

## できること

- 元メモから整理した33件の行き先、15件の食・買い物候補。訪問店舗リストの支店（教保文庫の各店、イーマート、ロッテマート、オリーブヤング、MEGA MGC COFFEE、틈새라면、카페라리、トレーダース）も住所付きのカードにしています。
- 3言語のUI、名前・訪問理由。韓国語名や住所を併記。
- エリア・カテゴリ・希望条件・チェック済みで絞り込み。3言語を横断して検索。
- スポット詳細、Google Mapsリンク、住所コピー、共有用URL。
- APIキー設定後は詳細パネルでGoogle Mapsをプレビュー。
- 「エリア地図で見る」で、絞り込んだスポットを番号付きピンで表示。一覧・ピンの選択が連動し、詳細パネルも開けます。PCは左右、スマホは地図→一覧の配置です。
- チェックと言語設定を端末内に保存。端末間・他の人とは同期しません。
- 自由なMarkdownの掲載、構造化したMarkdownからカード・旅程を生成。
- ホテルの情報を掲載する機能はありません。

現在の候補は元メモを整理したもので、全店舗の営業・所在地確認を完了した一覧ではありません。住所の確認日と出典を登録した店舗以外は「地図で検索」と表示します。営業時間や在庫は断定していません。元の自由メモは原文のまま掲載し、言語切り替えで機械翻訳はしません。

## メモを追加・更新する

`mds/` 以下のMarkdownを再帰的に読み込みます。自由記述だけのファイルは「旅のメモ」に表示されます。カードにしたいときは以下のようにfrontmatterを付けます。

```md
---
type: spot
id: new-bookshop
title:
  ja: 気になる本屋
  ko: 관심 있는 서점
  en: A bookshop to visit
area: hongdae
category: books
priority: if-time
koreanName: 관심 있는 서점
---
近くまで来たら寄ってみたい。
```

`type`・`id`・`title` が必須。IDは小文字英数字とハイフンを使い、全ファイルで一意にしてください。名前を変えてもIDを維持すると共有URLが変わりません。翻訳を省略した場合は日本語が表示されます。本文は詳細に表示されます。本文にも3言語を用意する場合は、frontmatterの `description: { ja: ..., ko: ..., en: ... }` を使用します。

任意項目：`address`（韓国語住所）、`query`（地図検索語の上書き）、`mapsUrl`（確認済み地図URL）、`website`（公式サイト）、`sourceUrl`（出典・参考）、`verifiedAt`（文字列の日付）、`related`（関連ID配列）。URLは `https://` のみ許可します。

複数項目を一つのファイルにまとめる場合は `type: collection` と `entries:` 配列を使用します。例は [mds/spots.md](mds/spots.md)、[mds/stores.md](mds/stores.md)、[mds/wishlist.md](mds/wishlist.md) を参照。[mds/stores.md](mds/stores.md) は [mds/2026-09-22_訪問店舗リスト.md](mds/2026-09-22_訪問店舗リスト.md) で住所を確認した支店をカード化したもので、元の自由メモも「旅のメモ」にそのまま残しています。

| 項目 | 値 |
| --- | --- |
| type | `spot`（場所）、`wish`（食・買い物）、`day`（旅程）、`note`（自由メモ）、`collection`（複数のspot/wish） |
| priority | `candidate`（候補、既定）、`if-time`（行けたら）、`if-found`（見かけたら） |
| area | `hongdae`, `hapjeong`, `sinchon`, `yeonhui`, `yongsan`, `gwanghwamun`, `seongsu`, `jamsil`, `jongno`, `myeongdong`, `seoul-station`, `seocho`, `gangnam`, `magok`, `anywhere`, `unconfirmed` |
| category | `books`, `anime`, `music`, `design`, `electronics`, `shopping`, `walk`, `cafe`, `meal`, `sweet`, `other` |

新しいエリアやカテゴリ名も使えます。辞書にない値はそのまま表示されるので、必要なら `src/i18n.ts` に3言語のラベルを追加してください。

### エリア地図にピンを追加する

スポットのfrontmatter（コレクションの場合は各entry）に `location` を追加します。Markdownを更新してpushすると地図にも反映され、サーバーやGeocoding APIは不要です。

```yaml
location:
  lat: 37.5580543
  lng: 126.9260821
  kind: place
  sourceUrl: 'https://www.waze.com/live-map/directions/kr/seoul/animate-hongdae?to=place.ChIJIS5I20WZfDUR94oKsom82WA'
  checkedAt: '2026-09-22'
```

`lat` / `lng` は数値、出典URLと確認日は必須です。`kind` は店舗・施設なら `place`（既定）、明洞など街の代表位置なら `area` にします。地図の表示中心ではなく、目的地の座標を使用してください。住所だけでは自動的にピンになりません。

2026-09-22時点で、全30スポットに位置を登録しています（既存9件＋今回確認した21件）。龍山の電気街などはエリアの代表位置、店舗は確認した店舗・建物の位置です。支店カードと重複するロッテマート・オリーブヤング・MEGA Coffeeの共通メモは、IDと関連リンクを保ったまま「食べたい・買いたい」へ移しました。選定理由と座標の確認方法は[位置調査メモ](docs/spot-location-research-2026-09-22.md)を参照してください。今後追加する未確認の位置や支店未選択の店舗は「位置・支店の確認待ち」に残し、推測した位置にピンを置きません。位置の出典は各選択カードから参照できます。登録座標の一部はOpenStreetMap由来で、地図下にクレジットを表示しています。

### 日程を後から追加する

以下を `mds/days/day-01.md` などとして保存します。日程未定の間はサイトに空の予定画面だけを表示し、メモのファイル名の日付を旅行日には使いません。

```md
---
type: day
id: day-one
title:
  ja: 弘大を歩く日
  ko: 홍대를 걷는 날
  en: A day in Hongdae
date: "2026-10-01" # 実際の旅行日に変更
events:
  - time: "11:00"
    title:
      ja: アニメショップへ
      ko: 애니메이션 숍으로
      en: Visit an anime shop
    ref: animate-hongdae
  - title: 自由時間
---
```

`time` は省略でき、`ref` で登録済みスポット・買い物項目を参照できます。日付・時刻は引用符で囲んでください。時刻表示は旅先の現地時間として扱い、タイムゾーン変換は行いません。

不正なデータ、重複ID、存在しない参照先はファイル名付きのビルドエラーになります。その状態ではGitHub Actionsは公開を実行せず、前回の公開内容を維持します。元メモとカード用メモは独立した資料なので、内容を変更するときは必要な方を編集してください。自由メモの書き換えから既存カードが自動再解釈されることはありません。

## GitHub Pagesで公開する

対象：`shinebalance/personal-trip-handbook`。設定後の公開先は `https://shinebalance.github.io/personal-trip-handbook/` です。

1. GitHubリポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にします。
2. 下記の地図キーを登録します。後回しでもサイトは公開でき、地図リンクは利用できます。
3. このプロジェクトの変更を `main` にcommit / pushします。
4. **Actions → Publish travel handbook** が成功すれば公開完了です。以後はMarkdownをpushするたびに自動更新します。

`.github/workflows/pages.yml` がビルドと配置を行います。別のリポジトリ名や独自ドメインを使う場合は `PAGES_BASE_PATH` を変更してください。共有URLはハッシュ形式なので、Pagesで直接開いたり再読み込みしたりできます。

## Google Mapsキーを設定する

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを選択または作成し、Googleの案内に従って必要な請求先設定を済ませます。
2. **APIとサービス → ライブラリ** で **Maps Embed API** を有効にします。
3. **認証情報 → 認証情報を作成 → APIキー** からキーを作成します。
4. キーの **アプリケーションの制限** を **ウェブサイト** にし、許可する参照元に `https://shinebalance.github.io/*` を指定します。ブラウザは外部iframeへの参照元としてドメインのみを送る場合があるため、リポジトリのパス単位ではなくこのホストを許可します。同じホストで公開される自分の他リポジトリも許可範囲に入ります。
5. **APIの制限** は **キーを制限 → Maps Embed APIのみ** にします。ローカルで試す場合は必要に応じて `http://localhost:5173/*` と `http://127.0.0.1:5173/*` を追加します。
6. GitHubで **Settings → Secrets and variables → Actions → New repository secret** を開き、名前を **`GOOGLE_MAPS_EMBED_API_KEY`**、値を作成したキーにして保存します。
7. **Actions → Publish travel handbook → Run workflow** で再ビルドします。スポット詳細で地図が表示されます。

### 複数ピンのエリア地図を有効にする（既存キーがある場合）

1. 同じGoogle Cloudプロジェクトの **APIとサービス → ライブラリ** で **Maps JavaScript API** を有効にします。
2. 使用中のキーの **APIの制限** に、**Maps Embed API** と **Maps JavaScript API** の両方を追加します。ウェブサイト制限は上記のままで使えます。
3. 既存の `GOOGLE_MAPS_EMBED_API_KEY` をそのまま使う場合、GitHub Secretの追加・変更は不要です。このコードをpushしてPagesを再デプロイしてください。

キーを分けたい場合のみ、JavaScript API用のキーをGitHub Secret **`GOOGLE_MAPS_API_KEY`** に設定します。エリア地図はこのキーを優先し、未設定なら既存のEmbed用キーを使用します。

Maps JavaScript APIには請求先の設定が必要で、地図の読み込みは利用量に応じた課金対象です。Cloud Consoleで予算通知とクォータを確認してください。SDKは「エリア地図で見る」を選んだ際、表示対象に登録済みの位置がある場合にだけ読み込みます。Places APIやGeocoding APIは使用しません。

キーなし・通信失敗時も候補一覧と外部地図リンクは使用できます。地図のベースラベルは現地で読みやすい韓国語に固定し、スポット名・詳細・操作UIは3言語で切り替えます。

公式資料：[Maps JavaScript APIの設定](https://developers.google.com/maps/documentation/javascript/cloud-setup)、[利用と課金](https://developers.google.com/maps/documentation/javascript/usage-and-billing)。

ローカル開発では `.env.example` を `.env.local` にコピーし、`VITE_GOOGLE_MAPS_EMBED_API_KEY` にキーを設定して開発サーバーを再起動してください。

**GitHub Secretsはキーをソースコードへ記録しないための保管場所です。静的サイトで使う地図キーは最終的なJavaScriptとiframe URLから確認できます。秘密のまま配信する仕組みではないため、必ずウェブサイト制限とAPI制限を設定してください。** 設定したキーのエラー内容はGoogleのiframe内に表示され、サイト側から読み取れません。表示に問題があるときも外部地図リンクが使えます。

公式資料：[Maps Embed APIの準備](https://developers.google.com/maps/documentation/embed/quickstart)、[キー制限](https://developers.google.com/maps/api-security-best-practices)、[ViteのPages配置](https://vite.dev/guide/static-deploy.html#github-pages)。

## 公開情報と画像

`mds/` の内容は原則すべて公開サイトに入ります。ホテル、宿泊日、予約番号などの個人情報はこのフォルダに入れないでください。画面に出さないだけでは保護できません。

写真：[Seoul at Dusk](https://commons.wikimedia.org/wiki/File:Seoul_at_Dusk.jpg)、Markrosenrosen、[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)。ローカルにリサイズして収録し、画面ではトリミングして表示。画像の派生物には同ライセンスを適用します。サイトのフッターにもクレジットを掲載しています。

外部地図、外部リンク、Google Fontsはネット接続が必要です。フォント未読込時はシステムフォントにフォールバックします。オフライン専用のキャッシュや端末間同期は実装していません。
