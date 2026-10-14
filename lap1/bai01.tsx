import React, { useRef, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Image,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import Carousel, { Pagination } from "react-native-snap-carousel";

const { width: viewportWidth } = Dimensions.get("window");

// ================= DỮ LIỆU =================
const BANNER_DATA = [
  {
    id: "b1",
    title: "Bộ Sưu Tập Mùa Hè",
    discount: "Giảm đến 50%",
    image: "https://picsum.photos/seed/summer/600/300",
  },
  {
    id: "b2",
    title: "Thời Trang Công Sở",
    discount: "Mua 1 Tặng 1",
    image: "https://picsum.photos/seed/office/600/300",
  },
  {
    id: "b3",
    title: "Đồ Thể Thao Năng Động",
    discount: "Freeship mọi đơn",
    image: "https://picsum.photos/seed/sport/600/300",
  },
  {
    id: "b4",
    title: "Phụ Kiện Thời Trang",
    discount: "Sale cuối tuần",
    image: "https://picsum.photos/seed/accessory/600/300",
  },
];

const PRODUCT_DATA = [
  {
    id: "p1",
    name: "Áo Thun Basic Trắng",
    price: "150.000đ",
    image: "https://picsum.photos/seed/shirt1/200/250",
  },
  {
    id: "p2",
    name: "Quần Jean Ống Rộng",
    price: "350.000đ",
    image: "https://picsum.photos/seed/jean1/200/250",
  },
  {
    id: "p3",
    name: "Áo Khoác Bomber",
    price: "450.000đ",
    image: "https://picsum.photos/seed/jacket/200/250",
  },
  {
    id: "p4",
    name: "Váy Hoa Nhí Vintage",
    price: "250.000đ",
    image: "https://picsum.photos/seed/dress/200/250",
  },
];

// ================= COMPONENT CAROUSEL =================
const BannerCarousel = React.memo(function BannerCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef(null);

  const renderItem = useCallback(
    ({ item }) => (
      <TouchableOpacity activeOpacity={0.9} style={bannerStyles.card}>
        <Image source={{ uri: item.image }} style={bannerStyles.image} />
        <View style={bannerStyles.overlay}>
          <Text style={bannerStyles.title}>{item.title}</Text>
          <Text style={bannerStyles.discount}>{item.discount}</Text>
        </View>
      </TouchableOpacity>
    ),
    [],
  );

  return (
    <View style={bannerStyles.container}>
      <Carousel
        ref={carouselRef}
        data={BANNER_DATA}
        renderItem={renderItem}
        sliderWidth={viewportWidth}
        itemWidth={viewportWidth * 0.85}
        onSnapToItem={setActiveSlide}
        autoplay={true}
        autoplayInterval={3000}
        loop={true}
      />
      <Pagination
        dotsLength={BANNER_DATA.length}
        activeDotIndex={activeSlide}
        containerStyle={bannerStyles.pagination}
        dotStyle={bannerStyles.activeDot}
        inactiveDotStyle={bannerStyles.inactiveDot}
        inactiveDotOpacity={0.4}
        inactiveDotScale={0.7}
      />
    </View>
  );
});

// ================= COMPONENT CHÍNH =================
export default function Bai01() {
  const [cartCount, setCartCount] = useState(0);

  const handleAddToCart = useCallback((productName) => {
    setCartCount((c) => c + 1);
    Alert.alert("Thành công", `Đã thêm ${productName} vào giỏ hàng!`);
  }, []);

  const renderProductItem = useCallback(
    ({ item }) => (
      <View style={styles.productCard}>
        <Image source={{ uri: item.image }} style={styles.productImage} />
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productPrice}>{item.price}</Text>
        <TouchableOpacity
          style={styles.addToCartBtn}
          onPress={() => handleAddToCart(item.name)}
        >
          <Text style={styles.addToCartText}>+ Thêm vào giỏ</Text>
        </TouchableOpacity>
      </View>
    ),
    [handleAddToCart],
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header App */}
      <View style={styles.header}>
        <Text style={styles.logo}>Nhóm 7</Text>
        <View style={styles.cartContainer}>
          <Text style={styles.cartIcon}>mua</Text>
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* FlatList sản phẩm + Carousel ở header */}
      <FlatList
        data={PRODUCT_DATA}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={
          <View>
            <Text style={styles.sectionTitle}>Khuyến Mãi Hot</Text>
            <BannerCarousel />
            <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
              Mới Lên Kệ
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
      />
    </SafeAreaView>
  );
}

// ================= STYLES CHO CAROUSEL =================
const bannerStyles = StyleSheet.create({
  container: { paddingTop: 20, paddingBottom: 10 },
  card: {
    height: 180,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  image: { width: "100%", height: "100%" },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 15,
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  discount: { color: "#ffeaa7", fontSize: 14, marginTop: 5 },
  pagination: { paddingVertical: 10 },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2d3436",
  },
  inactiveDot: { backgroundColor: "#b2bec3" },
});

// ================= STYLES CHO APP =================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    zIndex: 10,
  },
  logo: { fontSize: 22, fontWeight: "900", color: "#2d3436", letterSpacing: 1 },
  cartContainer: { position: "relative" },
  cartIcon: { fontSize: 24 },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -8,
    backgroundColor: "#ff7675",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 20,
    marginBottom: 15,
    color: "#2d3436",
  },

  productCard: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 12,
    padding: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
  },
  productImage: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    marginBottom: 10,
  },
  productName: { fontSize: 14, color: "#2d3436", fontWeight: "600" },
  productPrice: {
    fontSize: 15,
    color: "#d63031",
    fontWeight: "bold",
    marginVertical: 5,
  },
  addToCartBtn: {
    backgroundColor: "#0984e3",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 5,
  },
  addToCartText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
});
