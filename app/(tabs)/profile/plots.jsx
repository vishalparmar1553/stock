import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { auth, db } from "../../../firebase";

export default function AllPlots() {
  const { t } = useTranslation();
  const router = useRouter();
  const isDark = useSelector((state) => state.user.isDark);

  const [loading, setLoading] = useState(true);
  const [plots, setPlots] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editData, setEditData] = useState({
    id: "",
    plotName: "",
    plotSize: "",
    location: "",
    sessionStart: new Date(),
    sprayTankLevel: "",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const bgColor = isDark ? "#0f0f0f" : "#f2f2f2";
  const cardColor = isDark ? "#1e1e1e" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#000000";
  const accentColor = isDark ? "#bb86fc" : "#6200ee";
  const secondaryColor = isDark ? "#333333" : "#eeeeee";
  const inputBg = isDark ? "#2a2a2a" : "#e8e8e8";

  const fetchPlots = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const plotRef = collection(db, "users", uid, "plots");
      const querySnapshot = await getDocs(plotRef);
      const fetched = [];
      querySnapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() });
      });
      setPlots(fetched);
    } catch (error) {
      console.error("Error fetching plots:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlots();
  }, []);

  const handleDelete = async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    Alert.alert(t("Delete Plot"), t("Are you sure?"), [
      { text: t("Cancel"), style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "users", uid, "plots", id));
            fetchPlots();
          } catch (err) {
            console.error("Error deleting plot:", err);
          }
        },
      },
    ]);
  };

  const handleEnd = async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await updateDoc(doc(db, "users", uid, "plots", id), {
        endDate: new Date().toISOString(),
      });
      fetchPlots();
    } catch (err) {
      console.error("Error ending session:", err);
    }
  };

  const handleUndo = async (id) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await updateDoc(doc(db, "users", uid, "plots", id), {
        endDate: null,
      });
      fetchPlots();
    } catch (err) {
      console.error("Error undoing end date:", err);
    }
  };

  const handleEdit = (plot) => {
    setEditData({
      id: plot.id,
      plotName: plot.plotName,
      plotSize: plot.plotSize.toString(),
      location: plot.location,
      sessionStart: new Date(plot.sessionStart),
      sprayTankLevel: plot.sprayTankLevel?.toString() ?? "",
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !editData.id) return;

    const trimmedName = editData.plotName.trim();
    const isValidSize = /^\d+(\.\d+)?$/.test(editData.plotSize);

    if (!trimmedName || !isValidSize) {
      Alert.alert(
        "Validation Error",
        "Enter a valid plot name and number area size."
      );
      return;
    }

    try {
      await updateDoc(doc(db, "users", uid, "plots", editData.id), {
        plotName: trimmedName,
        plotSize: parseFloat(editData.plotSize),
        location: editData.location,
        sessionStart: editData.sessionStart.toISOString(),
        sprayTankLevel: editData.sprayTankLevel
          ? parseFloat(editData.sprayTankLevel)
          : null,
      });
      setEditModalVisible(false);
      fetchPlots();
    } catch (err) {
      console.error("Error saving plot:", err);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={bgColor}
      />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginRight: 10,
              padding: 6,
              borderRadius: 8,
              backgroundColor: secondaryColor,
            }}
          >
            <Ionicons name="arrow-back" size={22} color={textColor} />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: textColor }}>
            My Plots
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={accentColor} />
        ) : plots.length === 0 ? (
          <Text style={{ color: textColor }}>No plots found.</Text>
        ) : (
          plots.map((plot) => (
            <View
              key={plot.id}
              style={{
                backgroundColor: cardColor,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                elevation: 5,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: accentColor,
                  }}
                >
                  {plot.plotName}
                </Text>
                <Ionicons name="leaf-outline" size={22} color={accentColor} />
              </View>

              <Text style={{ color: textColor, marginTop: 8 }}>
                📐 {t("Area")}:{" "}
                <Text style={{ fontWeight: "600" }}>{plot.plotSize}</Text>
              </Text>

              {plot.sprayTankLevel !== undefined && (
                <Text style={{ color: textColor, marginTop: 4 }}>
                  🚰 {t("Water Tank Level")}:{" "}
                  <Text style={{ fontWeight: "600" }}>
                    {plot.sprayTankLevel}
                  </Text>
                </Text>
              )}

              <Text style={{ color: textColor, marginTop: 4 }}>
                📍 {t("Location")}:{" "}
                <Text style={{ fontWeight: "600" }}>{plot.location}</Text>
              </Text>
              <Text style={{ color: textColor, marginTop: 4 }}>
                🕒 {t("Session Start:")}{" "}
                <Text style={{ fontWeight: "600" }}>
                  {new Date(plot.sessionStart).toDateString()}
                </Text>
              </Text>
              {plot.endDate && (
                <Text style={{ color: "#FF9800", marginTop: 4 }}>
                  🔚 {t("Session Ended")}:{" "}
                  <Text style={{ fontWeight: "600" }}>
                    {new Date(plot.endDate).toDateString()}
                  </Text>
                </Text>
              )}

              <View
                style={{
                  flexDirection: "row",
                  marginTop: 12,
                  justifyContent: "space-between",
                }}
              >
                {plot.endDate ? (
                  <TouchableOpacity
                    onPress={() => handleUndo(plot.id)}
                    style={{
                      flex: 1,
                      backgroundColor: "#4CAF50",
                      paddingVertical: 8,
                      borderRadius: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MaterialIcons name="undo" size={18} color="#fff" />
                    <Text style={{ color: "#fff", marginLeft: 6 }}>Undo</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => handleEdit(plot)}
                      style={{
                        flex: 1,
                        marginRight: 6,
                        backgroundColor: "#2196F3",
                        paddingVertical: 8,
                        borderRadius: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Feather name="edit" size={16} color="#fff" />
                      <Text style={{ color: "#fff", marginLeft: 6 }}>
                        {t("Edit")}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleEnd(plot.id)}
                      style={{
                        flex: 1,
                        marginHorizontal: 6,
                        backgroundColor: "#FF9800",
                        paddingVertical: 8,
                        borderRadius: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialIcons
                        name="stop-circle"
                        size={18}
                        color="#fff"
                      />
                      <Text style={{ color: "#fff", marginLeft: 6 }}>
                        {t("End")}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(plot.id)}
                      style={{
                        flex: 1,
                        marginLeft: 6,
                        backgroundColor: "#F44336",
                        paddingVertical: 8,
                        borderRadius: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#fff" />
                      <Text style={{ color: "#fff", marginLeft: 6 }}>
                        {t("Delete")}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "#000000aa",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: cardColor,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <Text style={{ color: textColor, fontSize: 18, marginBottom: 10 }}>
              {t("Edit")}
            </Text>

            <TextInput
              placeholder={t("Name")}
              value={editData.plotName}
              onChangeText={(text) =>
                setEditData({ ...editData, plotName: text })
              }
              style={{
                backgroundColor: inputBg,
                color: textColor,
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
              }}
              placeholderTextColor="#888"
            />

            <TextInput
              placeholder={t("Area")}
              keyboardType="decimal-pad"
              value={editData.plotSize}
              onChangeText={(text) =>
                setEditData({ ...editData, plotSize: text })
              }
              style={{
                backgroundColor: inputBg,
                color: textColor,
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
              }}
              placeholderTextColor="#888"
            />

            <TextInput
              placeholder={t("Water Tank Level")}
              keyboardType="decimal-pad"
              value={editData.sprayTankLevel}
              onChangeText={(text) =>
                setEditData({ ...editData, sprayTankLevel: text })
              }
              style={{
                backgroundColor: inputBg,
                color: textColor,
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
              }}
              placeholderTextColor="#888"
            />

            <TextInput
              placeholder={t("Location")}
              value={editData.location}
              onChangeText={(text) =>
                setEditData({ ...editData, location: text })
              }
              style={{
                backgroundColor: inputBg,
                color: textColor,
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
              }}
              placeholderTextColor="#888"
            />

            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{
                backgroundColor: inputBg,
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: textColor }}>
                {t("Session Start:")} {editData.sessionStart.toDateString()}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                mode="date"
                value={editData.sessionStart}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(e, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setEditData({ ...editData, sessionStart: selectedDate });
                  }
                }}
              />
            )}

            <View
              style={{
                flexDirection: "row",
                marginTop: 20,
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#777",
                  padding: 10,
                  borderRadius: 8,
                  marginRight: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff" }}>{t("Cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                style={{
                  flex: 1,
                  backgroundColor: "#4CAF50",
                  padding: 10,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff" }}>{t("Save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
