# 自行代管 AI 模型檔案（不依賴 staticimgly.com）

`@imgly/background-removal` 預設會在瀏覽器裡連到 IMG.LY 的 CDN
（`staticimgly.com`）下載 AI 模型跟 wasm 運算引擎。展場/客戶端某些網路環境
連不到這個網域，會造成去背卡在 0% 不動。這個資料夾就是用來放「自己代管」
的那份檔案，讓網站不用再依賴那個外部網域——這是套件官方 README 裡寫的建議
做法，不是我們自己土砲的。

程式碼那邊已經改成「優先讀這個資料夾裡的檔案，讀不到才自動退回連線下載
CDN」，所以這一步**沒做之前網站還是能動**（走原本連線下載的行為），做完
之後只是變得更穩定、不再受那個外部網域影響。

## 怎麼做（在你自己的電腦上跑，這台協作環境連不到這個網址）

1. 下載官方資料包（版本要跟 `package.json` 裡 `@imgly/background-removal`
   的版本一致，目前是 `1.7.0`）：

   ```bash
   curl -L -o imgly-data.tgz "https://staticimgly.com/@imgly/background-removal-data/1.7.0/package.tgz"
   tar -xzf imgly-data.tgz
   ```

2. 解壓後會有一個 `package/dist` 資料夾，把**裡面的所有內容**（不是
   `package/dist` 這個資料夾本身，是它裡面的東西）複製進這個 repo 的
   `public/ai-models/` 底下：

   ```bash
   cp -r package/dist/* /path/to/NTOexhibit2026/public/ai-models/
   ```

3. 確認一下檔案大小，GitHub 單一檔案超過 100MB 會需要額外處理（Git LFS），
   先確認有沒有踩到這個雷：

   ```bash
   cd /path/to/NTOexhibit2026
   du -sh public/ai-models
   find public/ai-models -size +90M
   ```

   如果 `find` 那行有印出任何檔案，先不要 commit，把結果貼給我，我再看
   怎麼處理（通常是改用 Vercel Blob 或 Git LFS，而不是直接進 git）。

4. 沒有超過 100MB 的檔案的話，直接 commit + push：

   ```bash
   git add public/ai-models
   git commit -m "Self-host AI model and wasm assets"
   git push origin main
   ```

推上去之後 Vercel 會自動重新部署，之後去背就會優先讀自己網站上的檔案，
不用再連 `staticimgly.com`。
