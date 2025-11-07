# Inventory XCloud - Project Status & Roadmap

**Date:** 2025-01-08

## 1. TỔNG QUAN TRẠNG THÁI HIỆN TẠI

Sau quá trình refactor và chỉnh sửa toàn diện, ứng dụng đã đạt được sự nhất quán về cấu trúc file, routing, và logic gọi dữ liệu. Các module Master Data và một phần Operations đã được ổn định.

Chúng ta đã loại bỏ gần như toàn bộ các lời gọi RPC không cần thiết (`get_gi_list`, `create_goods_receipt_with_lines`) và thay thế bằng các câu lệnh Supabase chuẩn (`.select()`, `.insert()`, `.update()`), giúp mã nguồn trở nên minh bạch và dễ bảo trì hơn.

---

## 2. CÁC TÁC VỤ ĐÃ HOÀN THÀNH VÀ ỔN ĐỊNH

- **✅ Nền tảng & Cấu trúc:**
    -   Thiết lập layout chính (Sidebar, Topbar, Breadcrumb).
    -   Hệ thống routing đã được chuẩn hóa.
    -   Quản lý trạng thái UI và xác thực người dùng (Zustand).
    -   Supabase client được thiết lập và sử dụng nhất quán từ `lib/supabase.ts`.

- **✅ Module Xác thực (Authentication):**
    -   Trang đăng nhập hoạt động ổn định.
    -   Cơ chế `PrivateRoute` đảm bảo chỉ người dùng đã đăng nhập mới truy cập được các trang nội bộ.

- **✅ Module Master Data (Hoàn thiện):**
    -   Đã hoàn thiện toàn bộ luồng **CRUD (Create, Read, Update, Delete)** cho các đối tượng:
        -   `Organizations` (Tổ chức)
        -   `Branches` (Chi nhánh)
        -   `Warehouses` (Kho)
        -   `Locations` (Vị trí)
        -   `Partners` (Đối tác)
        -   `UoM Categories` (Nhóm đơn vị tính)
        -   `UoMs` (Đơn vị tính)
        -   `Goods Types` (Loại hàng hóa)
        -   `Goods Models` (Mẫu hàng hóa - SKU), bao gồm cả chức năng upload hình ảnh.
    -   Đã dọn dẹp các file và route bị trùng lặp.

- **✅ Module Vận hành (Operations - Đã hoàn thiện một phần):**
    -   **Goods Receipt (GR):**
        -   Trang danh sách (List Page): Hoạt động tốt.
        -   Trang tạo mới/chỉnh sửa (Create/Edit Page): Hoàn thiện, đã loại bỏ RPC.
        -   Trang xem chi tiết (View Page): Hoàn thiện, có hiển thị lịch sử trạng thái.
    -   **Goods Issue (GI):**
        -   Trang danh sách (List Page): Hoàn thiện, đã loại bỏ RPC.
        -   Trang tạo mới (Create Page): **Hoàn thiện**, bao gồm logic phức tạp của **Issue Mode (Detail & Summary)** và modal chọn hàng tồn kho chi tiết.
        -   Trang xem chi tiết (View Page): Hoàn thiện, có hiển thị lịch sử trạng thái.
    -   **Onhand:** Trang xem tồn kho chi tiết đã hoàn thiện với bộ lọc mạnh mẽ.
    
- **✅ Trang Dashboard (V1):**
    -   Giao diện đã được xây dựng với các thẻ KPI, biểu đồ cột, biểu đồ đường và danh sách giao dịch gần đây.
    -   **Đang chờ hành động từ bạn để hoạt động.**

---

## 3. ⚠️ HÀNH ĐỘNG CẦN THỰC HIỆN (BLOCKERS)

Dashboard sẽ không hiển thị dữ liệu cho đến khi bạn thực hiện hành động sau:

- **Tạo hàm RPC `get_dashboard_stats`:** Chức năng này sẽ tổng hợp tất cả dữ liệu cần thiết cho dashboard trong một lần gọi duy nhất, giúp tối ưu hiệu năng.
- **Vui lòng chạy đoạn mã SQL sau trong Supabase SQL Editor của bạn:**

```sql
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS jsonb AS $$
DECLARE
    _result jsonb;
    _total_skus int;
    _total_warehouses int;
    _transactions_today int;
    _pending_approvals int;
    _inventory_by_warehouse jsonb;
    _activity_last_7_days jsonb;
    _recent_transactions jsonb;
BEGIN
    -- 1. Total SKUs
    SELECT count(*) INTO _total_skus FROM public.goods_models WHERE is_active = true;

    -- 2. Total Warehouses
    SELECT count(*) INTO _total_warehouses FROM public.warehouses WHERE is_active = true;

    -- 3. Transactions Today
    SELECT count(*) INTO _transactions_today
    FROM (
        SELECT id FROM public.goods_receipts WHERE created_at >= date_trunc('day', now())
        UNION ALL
        SELECT id FROM public.goods_issues WHERE created_at >= date_trunc('day', now())
    ) AS transactions;

    -- 4. Pending Approvals (GRs in 'APPROVED' status awaiting completion)
    SELECT count(*) INTO _pending_approvals FROM public.goods_receipts WHERE status = 'APPROVED';

    -- 5. Inventory by Warehouse
    SELECT jsonb_agg(t) INTO _inventory_by_warehouse FROM (
        SELECT
            w.name AS warehouse_name,
            sum(o.quantity) AS total_quantity
        FROM public.onhand o
        JOIN public.warehouses w ON o.warehouse_id = w.id
        GROUP BY w.name
        ORDER BY total_quantity DESC
        LIMIT 10
    ) t;

    -- 6. Transaction Activity (Last 7 Days)
    WITH date_series AS (
        SELECT generate_series(
            date_trunc('day', NOW() - interval '6 days'),
            date_trunc('day', NOW()),
            '1 day'::interval
        )::date AS day
    )
    SELECT jsonb_agg(t) INTO _activity_last_7_days FROM (
        SELECT
            to_char(ds.day, 'YYYY-MM-DD') AS date,
            (SELECT count(*) FROM public.goods_receipts gr WHERE date_trunc('day', gr.created_at) = ds.day) AS gr_count,
            (SELECT count(*) FROM public.goods_issues gi WHERE date_trunc('day', gi.created_at) = ds.day) AS gi_count
        FROM date_series ds
        ORDER BY ds.day
    ) t;
    
    -- 7. Recent Transactions (last 10 combined)
    SELECT jsonb_agg(transactions) INTO _recent_transactions FROM (
        SELECT * FROM (
            SELECT 'GR' AS type, gr.id, gr.reference_number AS code, gr.status, gr.created_at, w.name AS warehouse_name
            FROM public.goods_receipts gr
            JOIN public.warehouses w ON gr.warehouse_id = w.id
            ORDER BY gr.created_at DESC LIMIT 5
        ) AS gr_trans
        UNION ALL
        SELECT * FROM (
            SELECT 'GI' AS type, gi.id, gi.reference_number AS code, gi.status, gi.created_at, w.name AS warehouse_name
            FROM public.goods_issues gi
            JOIN public.warehouses w ON gi.warehouse_id = w.id
            ORDER BY gi.created_at DESC LIMIT 5
        ) AS gi_trans
        ORDER BY created_at DESC LIMIT 10
    ) AS transactions;

    -- Combine results
    _result = jsonb_build_object(
        'total_skus', _total_skus,
        'total_warehouses', _total_warehouses,
        'transactions_today', _transactions_today,
        'pending_approvals', _pending_approvals,
        'inventory_by_warehouse', coalesce(_inventory_by_warehouse, '[]'::jsonb),
        'activity_last_7_days', coalesce(_activity_last_7_days, '[]'::jsonb),
        'recent_transactions', coalesce(_recent_transactions, '[]'::jsonb)
    );

    RETURN _result;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. LỘ TRÌNH CÔNG VIỆC TIẾP THEO (ROADMAP)

### **Tác Vụ Tiếp Theo: Inventory Count (IC) Module**
Đây là module vận hành cốt lõi tiếp theo cần được xây dựng.
-   **Bước 1: Trang danh sách (List Page):** Hiển thị danh sách các phiếu kiểm kê đã tạo.
-   **Bước 2: Trang tạo mới (Create Page):** Cho phép người dùng tạo phiếu kiểm kê theo kho, loại kiểm kê (toàn phần, theo chu kỳ).
-   **Bước 3: Trang chi tiết (View Page):** Hiển thị chi tiết phiếu kiểm kê, so sánh số liệu hệ thống và số liệu thực tế, tính toán chênh lệch.

### **Các Tác Vụ Sau Đó:**
1.  **Goods Transfer (GT) Module:** Xây dựng luồng điều chuyển hàng hóa giữa các kho.
2.  **Putaway (PA) Module:** Xây dựng chức năng gợi ý/ghi nhận vị trí cất hàng sau khi nhận hàng.
3.  **Reports Page Enhancement:** Tích hợp logic gọi API/RPC thực tế để chạy và xuất báo cáo thay vì dùng dữ liệu giả.
4.  **Settings Page:** Xây dựng giao diện cho người dùng thay đổi cài đặt cá nhân và hệ thống.
5.  **Final Polish & Review:** Rà soát toàn bộ UI/UX, xử lý các trường hợp lỗi, tối ưu hóa hiệu năng và hoàn thiện tài liệu.
