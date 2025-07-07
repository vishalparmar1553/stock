import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { auth, db } from "../../../firebase";

export default function CreateSchedules() {
  const { t } = useTranslation();
  const router = useRouter();
  const isDark = useSelector((state) => state.user.isDark);
  const [loading, setLoading] = useState(true);
  const [plots, setPlots] = useState([]);

  const bgColor = isDark ? "#121212" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#000000";
  const cardBg = isDark ? "#1e1e1e" : "#f9f9f9";

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const plotsRef = collection(db, "users", uid, "plots");

    const unsubscribe = onSnapshot(plotsRef, (snapshot) => {
      const plotList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlots(plotList);
      setLoading(false);
    });

    return () => unsubscribe(); // Stop listening on unmount
  }, []);

  const goToPlot = (plot) => {
    router.push(`/schedules/${plot.id}`);
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: bgColor,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#27ae60" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={bgColor}
      />

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: textColor,
            marginBottom: 20,
          }}
        >
          {t("Select Plot to Add Schedule")}
        </Text>

        {plots.length === 0 ? (
          <Text
            style={{ color: textColor, textAlign: "center", marginTop: 50 }}
          >
            No plots found. Add a plot first.
          </Text>
        ) : (
          plots.map((plot) => (
            <TouchableOpacity
              key={plot.id}
              onPress={() => goToPlot(plot)}
              style={{
                backgroundColor: cardBg,
                padding: 15,
                borderRadius: 12,
                marginBottom: 15,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View>
                <Text
                  style={{ color: textColor, fontSize: 18, fontWeight: "600" }}
                >
                  {plot.plotName}
                </Text>
                <Text style={{ color: textColor, fontSize: 14, opacity: 0.7 }}>
                  {t("Size")}: {plot.plotSize} | {t("Location")}:{" "}
                  {plot.location}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={textColor} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
