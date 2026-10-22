import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View, StyleSheet, useWindowDimensions, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Full-screen picture viewer: shows the whole image (pinch to zoom on iPhone),
// closes with the X or a tap on the dark background.
export function ImageViewer({ uri, visible, onClose }: { uri?: string | null; visible: boolean; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  if (!uri) return null;
  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close image" />
        <ScrollView
          style={StyleSheet.absoluteFill}
          contentContainerStyle={{ width, height, alignItems: "center", justifyContent: "center" }}
          maximumZoomScale={4}
          minimumZoomScale={1}
          bouncesZoom
          centerContent
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={onClose} style={{ width, height }}>
            <Image source={{ uri }} style={{ width, height }} resizeMode="contain" />
          </Pressable>
        </ScrollView>
        <TouchableOpacity
          onPress={onClose}
          accessibilityLabel="Close image"
          style={[styles.close, { top: insets.top + 10 }]}
        >
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.hint, { bottom: insets.bottom + 14 }]}>Tap anywhere to close</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.94)" },
  close: { position: "absolute", right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  hint: { position: "absolute", alignSelf: "center", color: "rgba(255,255,255,0.6)", fontSize: 12 },
});
