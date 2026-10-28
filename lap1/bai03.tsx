import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEvent, useEventListener } from "expo";
import { useVideoPlayer, VideoView, VideoSource } from "expo-video";
import {
  ExitFullscreenIcon,
  FastForward10Icon,
  FullscreenIcon,
  MiniplayerIcon,
  PauseIcon,
  PlayIcon,
  ReplayIcon,
  Rewind10Icon,
  VolumeHighIcon,
  VolumeMuteIcon,
} from "./youtubeIcons";

// ============ DỮ LIỆU GIẢ: danh sách video (1 file local + các video mẫu công khai còn hoạt động) ============
type VideoItem = {
  id: string;
  title: string;
  channel: string;
  views: string;
  durationText: string; // thời lượng hiển thị (trang trí cho danh sách)
  emoji: string; // biểu tượng thay cho ảnh thumbnail
  color: string; // màu nền placeholder thumbnail
  source: VideoSource; // nguồn video: file local (require) hoặc URL
};

const VIDEO_LIST: VideoItem[] = [
  {
    id: "v1",
    title: "Video demo do Gemini tạo (file local trong assets)",
    channel: "TKDD · expo-video demo",
    views: "File local · assets/demo-video.mp4",
    durationText: "0:10",
    emoji: "🎬",
    color: "#5b8def",
    source: require("../assets/demo-video.mp4"), // file local: expo-video hỗ trợ nguồn assetId
  },
  {
    id: "v2",
    title: "Hoa nở — video mẫu từ MDN (CORS an toàn cho Web)",
    channel: "MDN Web Docs",
    views: "Streaming · mdn.mozilla.net",
    durationText: "0:05",
    emoji: "🌸",
    color: "#9b59b6",
    source: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  },
  {
    id: "v3",
    title: "Big Buck Bunny — phim hoạt hình mã nguồn mở của Blender",
    channel: "test-videos.co.uk",
    views: "Streaming · 10 giây",
    durationText: "0:10",
    emoji: "🐰",
    color: "#e67e22",
    source:
      "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
  },
  {
    id: "v4",
    title: "Sintel — phim ngắn 3D phiêu lưu của Blender",
    channel: "test-videos.co.uk",
    views: "Streaming · 10 giây",
    durationText: "0:10",
    emoji: "🐉",
    color: "#16a085",
    source:
      "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4",
  },
  {
    id: "v5",
    title: "Sứa biển — video thiên nhiên độ phân giải cao",
    channel: "test-videos.co.uk",
    views: "Streaming · 10 giây",
    durationText: "0:10",
    emoji: "🪼",
    color: "#c0392b",
    source:
      "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4",
  },
];

// ============ Hàm tiện ích ============
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function statusLabel(status: string): string {
  switch (status) {
    case "idle":
      return "Chờ";
    case "loading":
      return "Đang tải…";
    case "readyToPlay":
      return "Sẵn sàng";
    case "error":
      return "Lỗi";
    default:
      return status;
  }
}

function formatSpeed(rate: number): string {
  return `${rate}x`;
}

// ============ THANH TUA (SeekBar) tự viết để demo sự kiện timeUpdate ============
const THUMB_SIZE = 14;

type SeekBarProps = {
  currentTime: number;
  duration: number;
  bufferedPosition: number;
  onSeek: (time: number) => void;
};

function SeekBar({ currentTime, duration, bufferedPosition, onSeek }: SeekBarProps) {
  const [width, setWidth] = useState(0);
  const [preview, setPreview] = useState<number | null>(null);
  const previewRef = useRef<number | null>(null);

  // Quy đổi vị trí chạm (px) -> thời gian (giây)
  const timeAt = useCallback(
    (x: number) => {
      if (width <= 0 || duration <= 0) return 0;
      const ratio = Math.min(1, Math.max(0, x / width));
      return ratio * duration;
    },
    [width, duration]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const t = timeAt(evt.nativeEvent.locationX);
          previewRef.current = t;
          setPreview(t);
        },
        onPanResponderMove: (evt) => {
          const t = timeAt(evt.nativeEvent.locationX);
          previewRef.current = t;
          setPreview(t);
        },
        onPanResponderRelease: () => {
          if (previewRef.current != null) onSeek(previewRef.current);
          previewRef.current = null;
          setPreview(null);
        },
        onPanResponderTerminate: () => {
          if (previewRef.current != null) onSeek(previewRef.current);
          previewRef.current = null;
          setPreview(null);
        },
      }),
    [timeAt, duration, onSeek]
  );

  const displayTime = preview ?? currentTime;
  const playedFrac = duration > 0 ? Math.min(1, displayTime / duration) : 0;
  const bufferedFrac = duration > 0 ? Math.min(1, bufferedPosition / duration) : 0;

  return (
    <View style={styles.seekRow}>
      <Text style={styles.timeText}>{formatTime(displayTime)}</Text>
      <View
        style={styles.seekTrack}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {/* Phần đã buffer (xám) */}
        <View style={[styles.seekBuffered, { width: bufferedFrac * width }]} />
        {/* Phần đã phát (đỏ) */}
        <View style={[styles.seekPlayed, { width: playedFrac * width }]} />
        {/* Nút kéo */}
        <View style={[styles.seekThumb, { left: playedFrac * width - THUMB_SIZE / 2 }]} />
      </View>
      <Text style={styles.timeText}>{formatTime(duration)}</Text>
    </View>
  );
}

// ============ MÀN HÌNH CHÍNH: trang xem video kiểu YouTube ============
export default function Bai03() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentVideo = VIDEO_LIST[currentIndex];

  // ===== Tạo player (chỉ khởi tạo 1 lần, tự dọn dẹp khi unmount) =====
  const player = useVideoPlayer(VIDEO_LIST[0].source, (player) => {
    // Bật sự kiện timeUpdate phát mỗi 0.5 giây để vẽ thanh tiến trình
    player.timeUpdateEventInterval = 0.5;
    player.loop = false;
  });

  const videoViewRef = useRef<VideoView | null>(null);

  // ===== Lắng nghe sự kiện bằng useEvent (trả về giá trị có state) =====
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });
  const { status } = useEvent(player, "statusChange", { status: player.status });
  const { currentTime, bufferedPosition } = useEvent(player, "timeUpdate", {
    currentTime: 0,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  });
  const { muted } = useEvent(player, "mutedChange", { muted: player.muted });
  const { playbackRate } = useEvent(player, "playbackRateChange", {
    playbackRate: player.playbackRate,
  });

  // ===== Lắng nghe sự kiện bằng useEventListener (cập nhật state thủ công) =====
  const [duration, setDuration] = useState(0);

  // sourceLoad cung cấp duration ngay khi load xong (chỉ emit trên native).
  useEventListener(player, "sourceLoad", ({ duration }) => {
    setDuration(duration);
  });

  // Trên web, expo-video KHÔNG emit sourceLoad, nên đọc duration từ player
  // qua sự kiện timeUpdate (được phát mỗi 0.5s nhờ timeUpdateEventInterval).
  useEventListener(player, "timeUpdate", () => {
    const d = player.duration;
    if (Number.isFinite(d) && d > 0) {
      setDuration((prev) => (Math.abs(prev - d) > 0.5 ? d : prev));
    }
  });

  // ===== State cho UI =====
  const [volume, setVolume] = useState(1);
  const [loop, setLoop] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liked, setLiked] = useState(false);

  // ===== Các hàm điều khiển player =====
  const togglePlay = useCallback(() => {
    if (isPlaying) player.pause();
    else player.play();
  }, [isPlaying, player]);

  const skipBack = useCallback(() => player.seekBy(-10), [player]);
  const skipForward = useCallback(() => player.seekBy(10), [player]);

  const seekTo = useCallback(
    (time: number) => {
      player.currentTime = time; // gán currentTime = seek chính xác
    },
    [player]
  );

  const toggleMute = useCallback(() => {
    player.muted = !muted;
  }, [muted, player]);

  const changeVolume = useCallback(
    (delta: number) => {
      setVolume((prev) => {
        const next = Math.max(0, Math.min(1, Math.round((prev + delta) * 10) / 10));
        player.volume = next;
        return next;
      });
    },
    [player]
  );

  const cycleSpeed = useCallback(() => {
    const speeds = [0.5, 1, 1.5, 2];
    const idx = speeds.indexOf(playbackRate);
    const next = speeds[(idx + 1) % speeds.length];
    player.playbackRate = next;
  }, [playbackRate, player]);

  const toggleLoop = useCallback(() => {
    const next = !loop;
    setLoop(next);
    player.loop = next;
  }, [loop, player]);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) videoViewRef.current?.exitFullscreen();
    else videoViewRef.current?.enterFullscreen();
  }, [isFullscreen]);

  const startPip = useCallback(async () => {
    try {
      await videoViewRef.current?.startPictureInPicture();
    } catch {
      Alert.alert(
        "PiP không khả dụng",
        "Thiết bị/cấu hình hiện tại không hỗ trợ Picture-in-Picture."
      );
    }
  }, []);

  // Chuyển video khác: demo replaceAsync (hỗ trợ cả file local lẫn URL)
  const selectVideo = useCallback(
    async (index: number) => {
      if (index === currentIndex) return;
      const video = VIDEO_LIST[index];
      setCurrentIndex(index);
      try {
        // URL: kèm metadata cho thông báo Now Playing; file local (assetId): truyền thẳng
        const source: VideoSource =
          typeof video.source === "string"
            ? { uri: video.source, metadata: { title: video.title, artist: video.channel } }
            : video.source;
        await player.replaceAsync(source);
        // Native: play ngay sau replace. Web: trình duyệt chặn autoplay khi
        // không có tương tác người dùng, nên để video nạp sẵn và người dùng bấm Play.
        if (Platform.OS !== "web") {
          player.play();
        }
      } catch {
        Alert.alert("Lỗi", "Không thể phát video này.");
      }
    },
    [currentIndex, player]
  );

  // ===== Render từng video liên quan =====
  const renderRelatedItem = ({ item, index }: { item: VideoItem; index: number }) => {
    const active = index === currentIndex;
    return (
      <TouchableOpacity
        style={[styles.relatedItem, active && styles.relatedItemActive]}
        onPress={() => selectVideo(index)}
      >
        <View style={[styles.relatedThumb, { backgroundColor: item.color }]}>
          <Text style={styles.relatedEmoji}>{item.emoji}</Text>
          <View style={styles.relatedDurationBadge}>
            <Text style={styles.relatedDurationText}>{item.durationText}</Text>
          </View>
          {active && (
            <View style={styles.relatedNow}>
              <Text style={styles.relatedNowText}>ĐANG PHÁT</Text>
            </View>
          )}
        </View>
        <View style={styles.relatedInfo}>
          <Text style={styles.relatedTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.relatedChannel}>
            {item.channel} · {item.views}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Thanh tiêu đề */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>▶ TKDD Video</Text>
        <Text style={styles.appBarSub}>Demo thư viện expo-video · Expo SDK 57</Text>
      </View>

      <FlatList
        data={VIDEO_LIST}
        keyExtractor={(item) => item.id}
        renderItem={renderRelatedItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* ===== KHU VỰC PHÁT VIDEO ===== */}
            <View style={styles.videoContainer}>
              <VideoView
                ref={videoViewRef}
                player={player}
                style={StyleSheet.absoluteFill}
                contentFit="contain"
                nativeControls={false}
                surfaceType="textureView"
                allowsPictureInPicture
                fullscreenOptions={{ enable: true }}
                onFullscreenEnter={() => setIsFullscreen(true)}
                onFullscreenExit={() => setIsFullscreen(false)}
              />

              {/* Lớp trong suốt bắt sự kiện chạm để ẩn/hiện điều khiển */}
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => setShowControls((v) => !v)}
              />

              {/* Vòng xoay khi đang tải */}
              {status === "loading" && (
                <View style={styles.loadingOverlay} pointerEvents="none">
                  <ActivityIndicator size="large" color="#FF0000" />
                  <Text style={styles.loadingText}>Đang tải video…</Text>
                </View>
              )}

              {/* Điều khiển tùy chỉnh (demo toàn bộ API player) */}
              {showControls && (
                <View style={styles.controlsOverlay} pointerEvents="box-none">
                  {/* Top: tiêu đề + trạng thái */}
                  <View style={styles.controlsTop}>
                    <Text style={styles.overlayTitle} numberOfLines={1}>
                      {currentVideo.title}
                    </Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>{statusLabel(status)}</Text>
                    </View>
                  </View>

                  {/* Center: nút phát / tua nhanh */}
                  <View style={styles.controlsCenter}>
                    <TouchableOpacity style={styles.skipBtn} onPress={skipBack}>
                      <Rewind10Icon size={28} />
                      <Text style={styles.skipBtnLabel}>10s</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bigPlayBtn} onPress={togglePlay}>
                      {isPlaying ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.skipBtn} onPress={skipForward}>
                      <FastForward10Icon size={28} />
                      <Text style={styles.skipBtnLabel}>10s</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Bottom: thanh tua + hàng nút */}
                  <View style={styles.controlsBottom}>
                    <SeekBar
                      currentTime={currentTime}
                      duration={duration}
                      bufferedPosition={bufferedPosition}
                      onSeek={seekTo}
                    />
                    <View style={styles.controlsRow}>
                      <TouchableOpacity style={styles.controlBtn} onPress={toggleMute}>
                        {muted ? <VolumeMuteIcon size={20} /> : <VolumeHighIcon size={20} />}
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.controlBtn} onPress={cycleSpeed}>
                        <Text style={styles.speedText}>{formatSpeed(playbackRate)}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.controlBtn, loop && styles.controlBtnActive]}
                        onPress={toggleLoop}
                      >
                        <ReplayIcon size={20} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.controlBtn} onPress={toggleFullscreen}>
                        {isFullscreen ? <ExitFullscreenIcon size={20} /> : <FullscreenIcon size={20} />}
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.controlBtn} onPress={startPip}>
                        <MiniplayerIcon size={20} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* ===== THÔNG TIN VIDEO (trang trí kiểu YouTube) ===== */}
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>{currentVideo.title}</Text>
              <Text style={styles.infoMeta}>
                {currentVideo.channel} · {currentVideo.views}
              </Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setLiked((v) => !v)}
                >
                  <Text style={styles.actionText}>{liked ? "❤️ Đã thích" : "🤍 Thích"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => Alert.alert("Chia sẻ", "Tính năng minh họa (chưa cài đặt).")}
                >
                  <Text style={styles.actionText}>🔗 Chia sẻ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => Alert.alert("Tải xuống", "Tính năng minh họa (chưa cài đặt).")}
                >
                  <Text style={styles.actionText}>⬇ Tải xuống</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ===== BẢNG THEO DÕI CÁC TÍNH NĂNG ĐANG CHẠY ===== */}
            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>🔧 Các tính năng expo-video đang chạy</Text>

              <View style={styles.featureRow}>
                <Text style={styles.featureLabel}>Trạng thái player</Text>
                <Text style={styles.featureValue}>{statusLabel(status)}</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureLabel}>Đang phát (playingChange)</Text>
                <Text style={styles.featureValue}>{isPlaying ? "Có" : "Không"}</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureLabel}>Thời gian hiện tại / tổng</Text>
                <Text style={styles.featureValue}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureLabel}>Đã buffer (bufferedPosition)</Text>
                <Text style={styles.featureValue}>{formatTime(bufferedPosition)}</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureLabel}>Tốc độ phát (playbackRate)</Text>
                <Text style={styles.featureValue}>{formatSpeed(playbackRate)}</Text>
              </View>

              <View style={styles.featureRow}>
                <Text style={styles.featureLabel}>Âm lượng (volume)</Text>
                <View style={styles.volumeControl}>
                  <TouchableOpacity style={styles.volumeBtn} onPress={() => changeVolume(-0.1)}>
                    <Text style={styles.volumeBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.volumeValue}>{Math.round(volume * 100)}%</Text>
                  <TouchableOpacity style={styles.volumeBtn} onPress={() => changeVolume(0.1)}>
                    <Text style={styles.volumeBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.featureRow}>
                <Text style={styles.featureLabel}>Tắt tiếng (muted)</Text>
                <Text style={styles.featureValue}>{muted ? "Có" : "Không"}</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureLabel}>Lặp lại (loop)</Text>
                <Text style={styles.featureValue}>{loop ? "Bật" : "Tắt"}</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureLabel}>Toàn màn hình</Text>
                <Text style={styles.featureValue}>{isFullscreen ? "Bật" : "Tắt"}</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureLabel}>Video đang chọn</Text>
                <Text style={styles.featureValue}>
                  #{currentIndex + 1} · {currentVideo.emoji}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Video liên quan</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f1f1f1" },

  appBar: {
    backgroundColor: "#FF0000",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appBarTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  appBarSub: { color: "#ffe0e0", fontSize: 12, marginTop: 2 },

  listContent: { paddingBottom: 24 },

  // ---- Khu vực video ----
  videoContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { color: "#fff", fontSize: 12, marginTop: 8 },

  controlsOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "space-between",
  },
  controlsTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  overlayTitle: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "600" },
  statusBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  statusBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  controlsCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  skipBtn: { alignItems: "center", marginHorizontal: 20 },
  skipBtnLabel: { color: "#fff", fontSize: 11, marginTop: 2 },
  bigPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  controlsBottom: { paddingHorizontal: 8, paddingBottom: 8 },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  controlBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnActive: { backgroundColor: "rgba(255,0,0,0.5)" },
  speedText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // ---- Thanh tua ----
  seekRow: { flexDirection: "row", alignItems: "center" },
  timeText: {
    color: "#fff",
    fontSize: 11,
    marginHorizontal: 8,
    fontVariant: ["tabular-nums"],
  },
  seekTrack: { flex: 1, height: 28, justifyContent: "center" },
  seekBuffered: {
    position: "absolute",
    left: 0,
    top: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  seekPlayed: {
    position: "absolute",
    left: 0,
    top: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FF0000",
  },
  seekThumb: {
    position: "absolute",
    top: 7,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#FF0000",
  },

  // ---- Thông tin video ----
  infoSection: {
    backgroundColor: "#fff",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  infoTitle: { fontSize: 16, fontWeight: "700", color: "#0f0f0f" },
  infoMeta: { fontSize: 12, color: "#606060", marginTop: 4 },
  actionRow: { flexDirection: "row", marginTop: 12, gap: 8 },
  actionBtn: {
    backgroundColor: "#f2f2f2",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionText: { fontSize: 13, fontWeight: "600", color: "#0f0f0f" },

  // ---- Bảng tính năng ----
  featuresSection: {
    backgroundColor: "#fff",
    padding: 14,
    marginTop: 8,
    marginHorizontal: 8,
    borderRadius: 10,
  },
  featuresTitle: { fontSize: 15, fontWeight: "700", color: "#0f0f0f", marginBottom: 8 },
  featureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  featureLabel: { fontSize: 13, color: "#606060" },
  featureValue: { fontSize: 13, fontWeight: "600", color: "#0f0f0f" },
  volumeControl: { flexDirection: "row", alignItems: "center" },
  volumeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  volumeBtnText: { fontSize: 16, fontWeight: "700", color: "#0f0f0f" },
  volumeValue: { fontSize: 13, fontWeight: "600", color: "#0f0f0f", marginHorizontal: 10 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f0f0f",
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 8,
  },

  // ---- Danh sách video liên quan ----
  relatedItem: {
    flexDirection: "row",
    padding: 10,
    marginHorizontal: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  relatedItemActive: { borderWidth: 2, borderColor: "#FF0000" },
  relatedThumb: {
    width: 130,
    height: 74,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  relatedEmoji: { fontSize: 30 },
  relatedDurationBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  relatedDurationText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  relatedNow: {
    position: "absolute",
    left: 4,
    top: 4,
    backgroundColor: "#FF0000",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  relatedNowText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  relatedInfo: { flex: 1, marginLeft: 10, justifyContent: "center" },
  relatedTitle: { fontSize: 13, fontWeight: "600", color: "#0f0f0f" },
  relatedChannel: { fontSize: 11, color: "#606060", marginTop: 4 },
});
