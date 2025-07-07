import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { auth, db } from "../../../firebase";

export default function Account() {
  const isDark = useSelector((state) => state.user.isDark);

  const [plots, setPlots] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const bgColor = isDark ? "#0f0f0f" : "#f2f2f2";
  const cardColor = isDark ? "#1e1e1e" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#000000";
  const accentColor = isDark ? "#bb86fc" : "#6200ee";
  const secondaryColor = isDark ? "#333333" : "#eeeeee";

  const fetchPlots = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const plotSnap = await getDocs(collection(db, "users", uid, "plots"));
    const list = plotSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setPlots(list);
    setSelectedPlot(list[0] || null);
  };

  useEffect(() => {
    fetchPlots();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={bgColor}
      />

      {/* Plot Selector */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, marginTop: 30 }}>
        <TouchableOpacity
          onPress={() => setDropdownVisible(true)}
          style={{
            backgroundColor: secondaryColor,
            padding: 12,
            borderRadius: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ color: textColor, fontSize: 16 }}>
            {selectedPlot?.plotName || "Select Plot"}
          </Text>
          <Ionicons name="chevron-down" size={20} color={textColor} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ padding: 20, marginTop: 10 }}>
        {/* Cost */}
        <View
          style={{
            backgroundColor: cardColor,
            borderRadius: 12,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Ionicons name="cash-outline" size={28} color={accentColor} />
          <View style={{ marginLeft: 16 }}>
            <Text style={{ color: textColor, fontSize: 16, fontWeight: "600" }}>
              Cost
            </Text>
            <Text
              style={{ color: textColor, fontSize: 18, fontWeight: "bold" }}
            >
              ₹{selectedPlot?.cost || 0}.00
            </Text>
          </View>
        </View>

        {/* Income */}
        <View
          style={{
            backgroundColor: cardColor,
            borderRadius: 12,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Ionicons name="wallet-outline" size={28} color={accentColor} />
          <View style={{ marginLeft: 16 }}>
            <Text style={{ color: textColor, fontSize: 16, fontWeight: "600" }}>
              Income
            </Text>
            <Text
              style={{ color: textColor, fontSize: 18, fontWeight: "bold" }}
            >
              ₹{selectedPlot?.income || 0}.00
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Buttons */}
      {showActions && (
        <View style={{ position: "absolute", bottom: 100, right: 25 }}>
          <TouchableOpacity
            onPress={() => {
              setShowActions(false);
              console.log("Add Cost");
              // openCostModal();
            }}
            style={{
              backgroundColor: cardColor,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Ionicons name="cash-outline" size={20} color={accentColor} />
            <Text style={{ color: textColor, marginLeft: 10 }}>Add Cost</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setShowActions(false);
              console.log("Add Income");
              // openIncomeModal();
            }}
            style={{
              backgroundColor: cardColor,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Ionicons name="wallet-outline" size={20} color={accentColor} />
            <Text style={{ color: textColor, marginLeft: 10 }}>Add Income</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating + Button */}
      <TouchableOpacity
        onPress={() => setShowActions((prev) => !prev)}
        style={{
          position: "absolute",
          bottom: 30,
          right: 20,
          backgroundColor: accentColor,
          borderRadius: 30,
          width: 60,
          height: 60,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 5,
        }}
      >
        <Ionicons name={showActions ? "close" : "add"} size={30} color="#fff" />
      </TouchableOpacity>

      {/* Plot Selection Dropdown */}
      {dropdownVisible && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <View
            style={{
              backgroundColor: cardColor,
              width: "80%",
              maxHeight: "60%",
              borderRadius: 10,
              padding: 20,
            }}
          >
            <ScrollView>
              {plots.map((plot) => (
                <TouchableOpacity
                  key={plot.id}
                  onPress={() => {
                    setSelectedPlot(plot);
                    setDropdownVisible(false);
                  }}
                  style={{
                    paddingVertical: 12,
                    borderBottomColor: secondaryColor,
                    borderBottomWidth: 1,
                  }}
                >
                  <Text style={{ color: textColor, fontSize: 16 }}>
                    {plot.plotName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}
