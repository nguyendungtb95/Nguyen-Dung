# Fashion Store Manager

Trang quản trị cho cửa hàng thời trang online, gồm:

| Mục | Chức năng |
|---|---|
| **Tổng quan** | KPI doanh thu, chi phí, lợi nhuận, số đơn, khách mới, tỷ lệ hủy/hoàn; so sánh với kỳ trước; biểu đồ theo ngày, doanh thu theo kênh, sản phẩm bán chạy, việc cần xử lý |
| **Đơn hàng & Tracking** | Luồng trạng thái Mới → Xác nhận → Đóng gói → Đang giao → Đã giao (+ Hoàn trả / Hủy), mã vận đơn, lịch sử tracking từng mốc thời gian, tra cứu theo mã đơn / SĐT / mã vận đơn |
| **Nhập đơn Shopee** | Nút “Nhập đơn Shopee (Excel)” ở trang Đơn hàng: đọc file xuất từ Kênh Người Bán (Quản Lý Đơn Hàng → Xuất), gộp dòng theo mã đơn, nhận diện giao / hủy / trả hàng, tính phí sàn (cố định + dịch vụ + thanh toán) vào chi phí, tạo khách hàng theo tài khoản Shopee. Hỗ trợ nhiều gian hàng (đặt tên shop khi nhập; báo cáo tách “Shopee · Shop chính / Shop phụ”). Nhập lại file mới chỉ cập nhật, không tạo trùng. File được đọc ngay trong trình duyệt, không gửi đi đâu. |
| **Đơn Facebook + SPX Express** | Form tạo đơn có đủ trường như SPX (người nhận, tỉnh / phường mới–cũ, địa chỉ chi tiết, COD, người trả phí, khối lượng, đồng kiểm). Nút “Sao chép thông tin SPX” để tạo vận đơn; điền mã đơn app (DH…) vào ô *Mã khách hàng* trên SPX. Nút “Nhập báo cáo SPX (Excel)” khớp vận đơn theo Mã khách hàng hoặc mã vận đơn → cập nhật trạng thái giao, phí ship thực tế (vận chuyển + hoàn + COD + bảo hiểm); vận đơn chưa có thì tạo đơn mới. Doanh thu theo tiền COD / giá trị đơn |
| **Sản phẩm & giá vốn** | Tự liệt kê mọi SKU / sản phẩm đã bán; nhập giá vốn trực tiếp (Enter để sang dòng) hoặc dán 2 cột SKU + giá vốn từ Excel; xem lãi / sản phẩm, biên lãi, tổng lãi gộp. Khi đã có giá vốn, lãi được tính: Doanh thu − Giá vốn − Phí sàn − Chi phí vận hành; tiền “Nhập hàng” chỉ là dòng tiền mua hàng dự trữ (không trừ trùng) |
| **Workflow** | Mô hình gợi ý cho shop online nhỏ: 6 phòng ban · 7 vị trí · 42 đầu việc định kỳ (hằng ngày / tuần / tháng) kèm KPI từng vị trí; checklist “Việc hôm nay” theo vị trí với giờ làm, nút mở trang liên quan, % hoàn thành; tỷ lệ hoàn thành 7 ngày; bảng Kanban kéo thả cho việc phát sinh |
| **Truyền thông Social** | Tổng quan traffic Fanpage / TikTok / YouTube (follower & mức tăng, lượt xem, tương tác, tỷ lệ tương tác, tin nhắn, đơn của kênh bán liên quan, tin nhắn → đơn), top bài, cơ cấu chủ đề & định dạng; lịch nội dung theo tháng với chỉ tiêu số bài / tuần; danh sách bài đăng theo luồng Ý tưởng → Sản xuất → Duyệt → Lên lịch → Đã đăng kèm kết quả từng bài; bảng nhập số liệu kênh theo ngày |
| **Chi phí quảng cáo** | Bảng nhập chi phí Ads theo ngày cho từng tài khoản (Facebook Ads, TikTok Ads, Shopee Ads từng shop…); nhập file báo cáo .csv/.xlsx từ trình quản lý quảng cáo (tự nhận cột ngày & chi phí, cộng theo ngày, bỏ dòng tổng; file không có cột ngày thì chia đều); ROAS, chi phí/đơn theo tài khoản & theo ngày. Chi phí Ads tự vào lãi lỗ, lãi theo kênh và ROAS ở Marketing |
| **Thu – Chi** | Sổ thu chi theo hạng mục, dòng tiền theo ngày, cơ cấu chi phí |
| **Thuế & affiliate** | Cài đặt thuế cho hộ kinh doanh (Thu – Chi → Cài đặt thuế): thuế bán hàng 1,5% doanh thu (chọn kênh áp dụng), thuế 8% trên phí sàn, thuế quảng cáo theo từng tài khoản (Facebook 10%, Shopee / TikTok 8%). Hạng mục chi “Hoa hồng Affiliate / KOC”. Mỗi khoản là một dòng riêng trong báo cáo lãi lỗ và chi tiết đơn |
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
