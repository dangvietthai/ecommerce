-- Insert sample orders
INSERT INTO orders (customer_name, customer_email, customer_phone, shipping_address, total_amount, status, payment_method, payment_status, notes)
VALUES 
  ('Nguyễn Văn A', 'nguyenvana@example.com', '0123456789', '123 Đường ABC, Quận 1, TP.HCM', 1500000, 'pending', 'cod', 'pending', 'Giao hàng buổi sáng'),
  ('Trần Thị B', 'tranthib@example.com', '0987654321', '456 Đường XYZ, Quận 2, TP.HCM', 2500000, 'processing', 'vnpay', 'paid', 'Giao hàng buổi chiều'),
  ('Lê Văn C', 'levanc@example.com', '0369852147', '789 Đường DEF, Quận 3, TP.HCM', 3500000, 'completed', 'vnpay', 'paid', 'Giao hàng buổi tối'),
  ('Phạm Thị D', 'phamthid@example.com', '0147852369', '321 Đường GHI, Quận 4, TP.HCM', 4500000, 'cancelled', 'cod', 'pending', 'Hủy đơn hàng');

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity, price)
SELECT 
  o.id,
  p.id,
  CASE 
    WHEN o.id = (SELECT id FROM orders WHERE customer_email = 'nguyenvana@example.com') THEN 2
    WHEN o.id = (SELECT id FROM orders WHERE customer_email = 'tranthib@example.com') THEN 3
    WHEN o.id = (SELECT id FROM orders WHERE customer_email = 'levanc@example.com') THEN 4
    ELSE 1
  END,
  CASE 
    WHEN o.id = (SELECT id FROM orders WHERE customer_email = 'nguyenvana@example.com') THEN 750000
    WHEN o.id = (SELECT id FROM orders WHERE customer_email = 'tranthib@example.com') THEN 833333
    WHEN o.id = (SELECT id FROM orders WHERE customer_email = 'levanc@example.com') THEN 875000
    ELSE 4500000
  END
FROM orders o
CROSS JOIN (
  SELECT id FROM products LIMIT 1
) p; 