import { StyleSheet, Text, View } from "react-native";

import type { SanPham } from "./duLieuGia";

// "Card holder": thay cho ảnh thật, mỗi sản phẩm được vẽ bằng màu nền + biểu tượng.
export default function TheSanPham({ sanPham }: { sanPham: SanPham }) {
  return (
    <View style={styles.the}>
      <View style={[styles.oAnh, { backgroundColor: sanPham.mauNen }]}>
        <Text style={styles.bieuTuong}>{sanPham.bieuTuong}</Text>
      </View>

      <Text style={styles.ten} numberOfLines={1}>
        {sanPham.ten}
      </Text>
      <Text style={styles.gia}>{sanPham.gia}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  the: {
    height: 300,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    boxShadow: "0px 6px 16px rgba(15, 23, 42, 0.12)",
  },
  oAnh: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  bieuTuong: {
    fontSize: 72,
  },
  ten: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  gia: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "600",
    color: "#2563eb",
  },
});
