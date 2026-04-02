# Deploy Checklist – Jira Branch Generator

## Trước khi submit

- [ ] Tăng `version` trong `manifest.json` (hiện tại: `1.0.0`)
- [ ] Thay `YOUR_USERNAME` trong `privacy-policy.html` và `store-description.md`
- [ ] Chụp ít nhất 1 screenshot 1280×800 của popup đang chạy
- [ ] Host `privacy-policy.html` lên GitHub Pages (xem hướng dẫn bên dưới)
- [ ] Build đúng ZIP: `cd jira-branch-extension && zip -r ../extension.zip .`

---

## Host Privacy Policy lên GitHub Pages

```bash
# 1. Tạo repo trên GitHub: jira-branch-extension
git init
git add .
git commit -m "feat: initial release v1.0.0"
git remote add origin https://github.com/YOUR_USERNAME/jira-branch-extension.git
git push -u origin main

# 2. Copy privacy policy vào repo
cp store-assets/privacy-policy.html docs/privacy-policy.html
git add docs/
git commit -m "docs: add privacy policy"
git push

# 3. Bật GitHub Pages
# GitHub repo → Settings → Pages → Source: Deploy from branch → main → /docs
# URL sẽ là: https://YOUR_USERNAME.github.io/jira-branch-extension/privacy-policy.html
```

---

## Chrome Web Store

1. Vào https://chrome.google.com/webstore/devconsole
2. Đăng ký developer account → trả $5 (một lần duy nhất)
3. **New Item** → upload `extension.zip`
4. Điền thông tin từ `store-description.md`:
   - Name, Short description, Full description
   - Category: **Developer Tools**
   - Language: English (có thể thêm tiếng Việt sau)
5. Upload screenshots (≥1 cái, 1280×800 hoặc 640×400)
6. Điền Privacy Policy URL
7. Mục **Permissions justification** — giải thích từng permission (copy từ store-description.md)
8. Submit → chờ review 1–3 ngày

---

## Microsoft Edge Add-ons (miễn phí, làm sau Chrome)

1. Vào https://partner.microsoft.com/dashboard
2. Tạo tài khoản → **New Extension**
3. Upload cùng file `extension.zip` (không cần sửa gì)
4. Điền thông tin từ phần "Edge Add-ons" trong `store-description.md`
5. Submit → chờ review 1–7 ngày

---

## Firefox AMO

### Sửa code trước khi submit

Thêm vào đầu `content.js` và `popup.js`:
```js
const _browser = typeof browser !== 'undefined' ? browser : chrome;
```

Thay toàn bộ `chrome.` → `_browser.` trong cả 2 file.

Hoặc dùng polyfill (khuyến khích):
```bash
npm install webextension-polyfill
# copy node_modules/webextension-polyfill/dist/browser-polyfill.min.js vào folder extension
# thêm vào manifest.json → content_scripts → js: ["browser-polyfill.min.js", "content.js"]
```

### Submit
1. Vào https://addons.mozilla.org/developers
2. **Submit a New Add-on** → upload ZIP đã sửa
3. Điền thông tin từ phần "Firefox AMO" trong `store-description.md`
4. Submit → review có thể mất vài ngày đến vài tuần

---

## Update sau này

```bash
# 1. Sửa code
# 2. Tăng version trong manifest.json
nano jira-branch-extension/manifest.json  # version: "1.0.1"

# 3. Build lại ZIP
cd jira-branch-extension && zip -r ../extension-v1.0.1.zip .

# 4. Push lên GitHub
git add .
git commit -m "fix: improve sprint detection v1.0.1"
git tag v1.0.1
git push origin main --tags

# 5. Upload ZIP mới lên từng store dashboard
```
