# Fashion Store Manager

Trang quản trị cho cửa hàng thời trang online, gồm:

| Mục | Chức năng |
|---|---|
| **Tổng quan** | KPI doanh thu, chi phí, lợi nhuận, số đơn, khách mới, tỷ lệ hủy/hoàn; so sánh với kỳ trước; biểu đồ theo ngày, doanh thu theo kênh, sản phẩm bán chạy, việc cần xử lý |
| **Đơn hàng & Tracking** | Luồng trạng thái Mới → Xác nhận → Đóng gói → Đang giao → Đã giao (+ Hoàn trả / Hủy), mã vận đơn, lịch sử tracking từng mốc thời gian, tra cứu theo mã đơn / SĐT / mã vận đơn |
| **Workflow** | Bảng Kanban kéo thả (Cần làm / Đang làm / Chờ duyệt / Hoàn thành), quy trình mẫu tạo việc hàng loạt, tự tạo việc đóng gói khi đơn được xác nhận |
| **Marketing** | Luồng triển khai chiến dịch (Ý tưởng → Sản xuất nội dung → Chờ duyệt → Đang chạy → Kết thúc, + Tạm dừng) với checklist; ngân sách & cảnh báo vượt ngân sách; hiệu quả theo kênh (chi phí, đơn, doanh thu, ROAS, CPA, khách mới) tính từ đơn hàng gắn chiến dịch và chi phí thật; gợi ý phân bổ ngân sách |
| **Thu – Chi** | Sổ thu chi theo hạng mục, dòng tiền theo ngày, cơ cấu chi phí |
| **Khách hàng** | Xem theo từng ngày: khách mới, khách mua, nhật ký chăm sóc; gợi ý khách cần xin feedback và khách lâu chưa tương tác; hạng khách (VIP / Thân thiết) |
| **Dữ liệu** | Xuất / nhập file JSON sao lưu, xóa dữ liệu mẫu |

## Cấu trúc

```
index.html
assets/style.css
assets/app.js
```

Là website tĩnh (HTML/CSS/JS), không cần cài đặt hay build. Biểu đồ dùng Chart.js từ CDN.

> **Lưu ý về dữ liệu:** dữ liệu được lưu trong trình duyệt (localStorage) của từng máy.
> Dùng mục **Dữ liệu → Xuất file JSON** để sao lưu hoặc chuyển sang máy khác.
> Nếu nhiều người cần dùng chung dữ liệu, cần bổ sung backend (VD: PHP + MySQL trên Hostinger).

## Đưa lên GitHub

1. Cài Git: https://git-scm.com/download/win
2. Tạo repository mới trên https://github.com/new (VD: `fashion-store-manager`).
3. Trong thư mục dự án:

```bash
git init
git add .
git commit -m "Fashion Store Manager"
git branch -M main
git remote add origin https://github.com/<tai-khoan>/fashion-store-manager.git
git push -u origin main
```

(Tùy chọn) Bật GitHub Pages: **Settings → Pages → Branch: main / root**.

## Đưa lên Hostinger

**Cách 1 – Kết nối Git (tự cập nhật từ GitHub):**
hPanel → **Websites → Manage → Advanced → Git** → nhập URL repo, branch `main`, thư mục `public_html` → **Create**, rồi bấm **Deploy**.
Có thể bật **Auto Deployment** và thêm webhook vào GitHub để mỗi lần push là web tự cập nhật.
(Repo private cần thêm SSH key của Hostinger vào GitHub → Settings → Deploy keys.)

**Cách 2 – Tải file lên thủ công:**
hPanel → **Files → File Manager** → mở `public_html` → upload `index.html` và thư mục `assets`.

Sau đó bật SSL (HTTPS) trong hPanel → **Security → SSL**.

> Vì trang quản trị chứa dữ liệu kinh doanh, nên đặt mật khẩu cho thư mục trong hPanel
> (**Advanced → Password Protect Directories**) để người lạ không vào được.
