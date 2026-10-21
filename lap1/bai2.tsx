import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";

// ============ DỮ LIỆU GIẢ: danh sách bài tập ============
type Assignment = {
  id: string;
  subject: string;
  title: string;
  deadline: string;
  status: "Chưa nộp" | "Đã nộp";
  fileName?: string; // tên file sinh viên đã chọn (nếu có)
  fileSize?: number; // dung lượng file (byte)
  fileUri?: string; // đường dẫn file để mở xem lại
};

const ASSIGNMENT_DATA: Assignment[] = [
  {
    id: "a1",
    subject: "Lập trình di động",
    title: "Bài tập: App giỏ hàng",
    deadline: "25/10/2026",
    status: "Chưa nộp",
  },
  {
    id: "a2",
    subject: "Cơ sở dữ liệu",
    title: "Bài tập: Thiết kế ERD",
    deadline: "28/10/2026",
    status: "Chưa nộp",
  },
  {
    id: "a3",
    subject: "Cấu trúc dữ liệu",
    title: "Bài tập: Cây nhị phân",
    deadline: "20/10/2026",
    status: "Đã nộp",
    fileName: "cay_nhi_phan.pdf",
  },
];

// ============ Hàm tiện ích: định dạng dung lượng file ============
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ============ MÀN HÌNH CHÍNH ============
export default function Bai02() {
  const [assignments, setAssignments] = useState<Assignment[]>(ASSIGNMENT_DATA);

  // Hàm mở thư viện DocumentPicker để chọn file cho bài tập có id tương ứng
  const pickFile = async (id: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        // Chỉ cho chọn các loại file thường dùng để nộp bài
        type: ["application/pdf", "image/*", "application/zip"],
        copyToCacheDirectory: true,
      });

      // Người dùng bấm hủy -> result.canceled = true
      if (result.canceled) {
        Alert.alert("Đã hủy", "Bạn chưa chọn file nào.");
        return;
      }

      // result.assets chứa danh sách file đã chọn, lấy file đầu tiên
      const file = result.assets[0];

      // Lưu tên + dung lượng + đường dẫn file vào đúng bài tập được chọn
      setAssignments((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                fileName: file.name,
                fileSize: file.size ?? 0,
                fileUri: file.uri,
              }
            : item
        )
      );
    } catch (error) {
      Alert.alert("Lỗi", "Không thể mở thư viện chọn file.");
    }
  };

  // Hàm mở lại file đã chọn để xem trước khi nộp
  const viewFile = (uri: string) => {
    Linking.openURL(uri).catch(() =>
      Alert.alert("Lỗi", "Không thể mở file này.")
    );
  };

  // Hàm nộp bài: chỉ cập nhật trạng thái (dữ liệu giả)
  const submitAssignment = (id: string) => {
    setAssignments((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (!item.fileName) {
          Alert.alert("Chưa có file", "Vui lòng chọn file trước khi nộp bài.");
          return item;
        }
        return { ...item, status: "Đã nộp" };
      })
    );
  };

  const renderItem = ({ item }: { item: Assignment }) => {
    const isSubmitted = item.status === "Đã nộp";
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.subject}>{item.subject}</Text>
          <View
            style={[styles.badge, isSubmitted ? styles.badgeDone : styles.badgeTodo]}
          >
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.deadline}>Hạn nộp: {item.deadline}</Text>

        {/* Khu vực chọn / hiển thị file */}
        <View style={styles.fileRow}>
          <TouchableOpacity
            style={styles.pickBtn}
            onPress={() => pickFile(item.id)}
          >
            <Text style={styles.pickBtnText}>
              {item.fileName ? "Đổi file khác" : "Chọn file"}
            </Text>
          </TouchableOpacity>

          {item.fileName && (
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {item.fileName} · {formatSize(item.fileSize ?? 0)}
              </Text>
              <TouchableOpacity onPress={() => viewFile(item.fileUri!)}>
                <Text style={styles.viewLink}>Xem lại</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Nút nộp bài (ẩn khi đã nộp) */}
        {!isSubmitted && (
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => submitAssignment(item.id)}
          >
            <Text style={styles.submitBtnText}>Gửi bài</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nộp Bài Tập</Text>
        <Text style={styles.headerSub}>
          Demo thư viện expo-document-picker
        </Text>
      </View>

      <FlatList
        data={assignments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  header: {
    backgroundColor: "#0984e3",
    padding: 20,
    paddingTop: 25,
  },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  headerSub: { color: "#d6eaf8", fontSize: 13, marginTop: 4 },

  list: { padding: 15 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subject: { fontSize: 14, color: "#0984e3", fontWeight: "700" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeDone: { backgroundColor: "#d4efdf" },
  badgeTodo: { backgroundColor: "#fdebd0" },
  badgeText: { fontSize: 12, fontWeight: "bold" },
  title: { fontSize: 17, fontWeight: "700", color: "#2d3436", marginTop: 8 },
  deadline: { fontSize: 13, color: "#636e72", marginTop: 4 },

  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
  },
  pickBtn: {
    backgroundColor: "#ecf0f1",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  pickBtnText: { fontSize: 14, color: "#2d3436", fontWeight: "600" },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 13, color: "#0984e3" },
  viewLink: {
    color: "#e17055",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },

  submitBtn: {
    backgroundColor: "#0984e3",
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 12,
  },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
});
