# SalaryOnline

## Cập nhật mới (đợt này)
1. Nút "職種変更" trên mỗi thẻ nhân viên & modal chi tiết – đổi vị trí nhanh giữa フロント / 厨房 / ラッカ.
2. Checkbox "早退" trong modal sửa ca làm (bấm vào 1 ô ngày trên lịch tuần) – đánh dấu ca đó là về sớm.
3. Ca làm tự động phân loại 早班 (bắt đầu trước 17h, màu xanh) / 晚班 (từ 17h trở đi, màu cam) trên lịch tuần và thẻ nhân viên.
4. Nút "来週へコピー" trên thẻ / modal nhân viên – copy toàn bộ ca của 1 người sang tuần kế tiếp.
5. Nút "来週へ複製" trên thanh Quick Actions – copy lịch của TẤT CẢ nhân viên sang tuần kế tiếp.
6. Thêm vị trí mới "拉客" (ラッカ) – có trong bộ lọc, form thêm nhân viên, thống kê, lịch tuần...
7. Bảng lịch tuần trên desktop: cột giờ/tên hiển thị full, chữ to hơn, không cần cuộn ngang.
8. Màu sắc phân biệt rõ 早班 (xanh) / 晚班 (cam) trên cả lịch tuần và pattern tuần trên thẻ nhân viên.
9. "整周排班" (Quick Week Schedule) chỉ còn 2 lựa chọn: 早班 (08:00-17:00) và 晚班 (17:00-00:00).
10. Kéo-thả (drag & drop) tên nhân viên từ nhóm vị trí này sang nhóm khác để đổi vị trí làm việc.
11. Tối ưu giao diện mobile: header/nav gọn hơn, card nhân viên compact hơn, lịch tuần chữ hợp lý hơn.

Toàn bộ tính năng cũ được giữ nguyên.

## Tạo tài khoản đăng nhập cho nhân viên (mới)
- Mở chi tiết 1 nhân viên → nút "ログインアカウント" (登录账号) → nhập email + mật khẩu → "アカウント作成".
- Cần đã bật Email/Password ở Firebase Console → Authentication → Sign-in method.
- Lưu ý kỹ thuật: 3 file Firebase SDK (app/database/auth) giờ tải qua CDN chính thức của Google (gstatic.com) thay vì host cục bộ như trước, vì file auth-compat.js quá lớn để nhúng trực tiếp. 2 file cục bộ cũ (firebase-app-compat.js, firebase-database-compat.js) không còn được dùng, có thể xoá khỏi thư mục hosting nếu muốn dọn dẹp.
- Do giới hạn của Firebase phía client, admin có thể TẠO tài khoản mới nhưng không thể tự đổi mật khẩu người khác trực tiếp — nếu nhân viên quên mật khẩu, cần bấm "リンク解除" (解除关联) rồi tạo lại tài khoản mới.

## Trang riêng cho nhân viên (staff.html) - MỚI
Nhân viên vào file `staff.html` (ví dụ: `https://<domain-cua-ban>/staff.html`) để:
- Đăng nhập bằng email/mật khẩu đã được admin tạo (mục "ログインアカウント" trong chi tiết nhân viên)
- Xem lịch làm của CHÍNH MÌNH theo tuần (không thấy lịch người khác)
- Gửi "リクエスト" (yêu cầu đổi lịch): xin nghỉ / đổi giờ làm / yêu cầu khác, kèm ghi chú
- Theo dõi trạng thái yêu cầu: 審査中 (đang chờ) / 承認済み (đã duyệt) / 却下 (từ chối)

## Quản lý yêu cầu (phía admin, trong index.html)
- Biểu tượng chuông 🔔 ở góc trên bên phải header, có số đỏ báo số yêu cầu đang chờ duyệt
- Bấm vào để xem danh sách, mỗi yêu cầu có 2 nút "承認" (duyệt) / "却下" (từ chối)
- Khi DUYỆT: nếu là "xin nghỉ" hoặc "đổi giờ", hệ thống TỰ ĐỘNG cập nhật luôn vào lịch tuần (không cần vào sửa tay); nếu là "yêu cầu khác" thì chỉ đánh dấu đã duyệt, admin tự vào chỉnh lịch nếu cần

Các file cần upload thêm lên hosting: `staff.html`, `staff.js` (cùng thư mục với `index.html`, `app.js`, `style.css`).
