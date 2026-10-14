import type { ImageSourcePropType } from "react-native";

// Dữ liệu giả (mock data) — khai báo sẵn để demo không phụ thuộc mạng / API.
export type SanPham = {
  id: string;
  ten: string;
  gia: string;
  bieuTuong: string; // thay cho ảnh thật
  mauNen: string;
};

export const DANH_SACH_SAN_PHAM: SanPham[] = [
  {
    id: "sp1",
    ten: "Tai nghe Bluetooth",
    gia: "590.000đ",
    bieuTuong: "🎧",
    mauNen: "#2563eb",
  },
  {
    id: "sp2",
    ten: "Đồng hồ thông minh",
    gia: "1.290.000đ",
    bieuTuong: "⌚",
    mauNen: "#7c3aed",
  },
  {
    id: "sp3",
    ten: "Giày thể thao",
    gia: "890.000đ",
    bieuTuong: "👟",
    mauNen: "#dc2626",
  },
  {
    id: "sp4",
    ten: "Ba lô du lịch",
    gia: "450.000đ",
    bieuTuong: "🎒",
    mauNen: "#059669",
  },
  {
    id: "sp5",
    ten: "Máy ảnh mini",
    gia: "2.150.000đ",
    bieuTuong: "📷",
    mauNen: "#d97706",
  },
  {
    id: "sp6",
    ten: "Điện thoại thông minh",
    gia: "4.990.000đ",
    bieuTuong: "📱",
    mauNen: "#db2777",
  },
];

// Ảnh nền cục bộ dùng cho Tab 3 (ParallaxImage bắt buộc phải có prop `source`).
export const ANH_NEN: ImageSourcePropType = require("../lap1/mobile-transfer.png");
