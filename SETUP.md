# Hướng Dẫn Cài Đặt & Deploy

## Bước 1: Tạo tài khoản Pusher (miễn phí)

1. Vào https://pusher.com → Đăng ký miễn phí
2. Tạo app mới: chọn **Channels** → **Create app**
3. Đặt tên app, chọn cluster **ap1** (châu Á)
4. Vào tab **App Keys** → chép 4 giá trị:
   - App ID
   - Key
   - Secret
   - Cluster

## Bước 2: Cài đặt biến môi trường

Tạo file `.env.local` trong thư mục dự án:

```
PUSHER_APP_ID=<app_id của bạn>
NEXT_PUBLIC_PUSHER_KEY=<key của bạn>
PUSHER_SECRET=<secret của bạn>
NEXT_PUBLIC_PUSHER_CLUSTER=ap1
```

## Bước 3: Deploy lên Vercel

### Cách nhanh nhất (khuyến nghị):

1. Tạo tài khoản tại https://vercel.com (miễn phí)
2. Cài Vercel CLI: `npm install -g vercel`
3. Trong thư mục dự án, chạy:
   ```bash
   vercel
   ```
4. Làm theo hướng dẫn trên màn hình
5. Thêm biến môi trường trong Vercel Dashboard:
   - Vào **Project Settings → Environment Variables**
   - Thêm 4 biến như trong `.env.local`

### Hoặc dùng GitHub:
1. Đẩy code lên GitHub
2. Vào https://vercel.com → **Import Project** từ GitHub
3. Thêm environment variables
4. Deploy!

## Bước 4: Sử dụng

| Người dùng | URL |
|------------|-----|
| Học sinh   | `https://your-app.vercel.app/` |
| Giáo viên  | `https://your-app.vercel.app/teacher` |

## Hướng dẫn chơi

1. **Học sinh**: Mở trang chính → nhập tên → chờ ô màu chuyển xanh
2. **Giáo viên**: Mở trang `/teacher` → nhấn **"Bắt Đầu!"**
3. Tất cả học sinh thấy ô màu chuyển **xanh** → bấm nút **BẤM!**
4. Trang giáo viên hiển thị ngay ai bấm đầu tiên và thời gian phản xạ
5. Nhấn **Reset** để chơi vòng mới
