import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { auth, db } from "../../../firebase";
import { setTheme, setUser } from "../../../redux/userSlice";

export default function Tab() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

  const reduxIsDark = useSelector((state) => state.user.isDark);
  const reduxUser = useSelector((state) => state.user.user);

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(reduxIsDark);
  const [themeLoading, setThemeLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/signin");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const fetchUserData = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserData(data);
        setIsDark(data.isDark === true);

        dispatch(setUser({ uid, ...data }));
        dispatch(setTheme(data.isDark === true));
      } else {
        console.warn("No user data found in Firestore.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const newTheme = !isDark;
      setThemeLoading(true);

      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        isDark: newTheme,
      });

      dispatch(setTheme(newTheme));
      setIsDark(newTheme);
    } catch (error) {
      console.error("Error updating theme:", error);
    } finally {
      setThemeLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const backgroundColor = isDark ? "#121212" : "#f9f9f9";
  const bgColor = isDark ? "#2b2b2b" : "#f5f5f5";
  const cardColor = isDark ? "#1e1e1e" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#000000";
  const emailColor = isDark ? "#00FFAA" : "#2c3e50";
  const phoneColor = isDark ? "#87CEFA" : "#2980b9";

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={bgColor}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1, backgroundColor }}
          contentContainerStyle={{
            paddingVertical: 40,
            paddingBottom: 100,
          }}
        >
          {loading ? (
            <ActivityIndicator color={isDark ? "#fff" : "#000"} size="large" />
          ) : (
            <>
              {/* Logo */}
              <View style={{ alignItems: "center", marginBottom: 24 }}>
                <Image
                  source={require("../../../assets/images/user.png")}
                  style={{ width: 150, height: 150 }}
                />
              </View>

              {/* Info Card */}
              <View
                style={{
                  backgroundColor: cardColor,
                  marginHorizontal: 20,
                  borderRadius: 20,
                  padding: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}
              >
                {/* Name */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <FontAwesome5 name="user-alt" size={18} color={textColor} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={{ color: textColor, fontWeight: "600" }}>
                      {t("Name")}:
                    </Text>
                    <Text style={{ color: textColor, fontSize: 16 }}>
                      {userData?.name || "User"}
                    </Text>
                  </View>
                </View>

                {/* Email */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <MaterialIcons name="email" size={18} color={emailColor} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={{ color: textColor, fontWeight: "600" }}>
                      {t("Email")}:
                    </Text>
                    <Text style={{ color: emailColor, fontSize: 16 }}>
                      {userData?.email}
                    </Text>
                  </View>
                </View>

                {/* Phone */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name="call-outline" size={18} color={phoneColor} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={{ color: textColor, fontWeight: "600" }}>
                      {t("Phone")}:
                    </Text>
                    <Text style={{ color: phoneColor, fontSize: 16 }}>
                      {userData?.phone}
                    </Text>
                  </View>
                </View>
                {/* Language Switcher */}
                <View
                  style={{
                    marginHorizontal: 20,
                    borderRadius: 12,
                    backgroundColor: cardColor,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => i18n.changeLanguage("en")}
                      style={{
                        backgroundColor: "#3498db",
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "600" }}>
                        English
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => i18n.changeLanguage("gn")}
                      style={{
                        backgroundColor: "#f39c12",
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "600" }}>
                        ગુજરાતી
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Buttons Inside Card */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 24,
                  }}
                >
                  <TouchableOpacity
                    onPress={handleLogout}
                    style={{
                      backgroundColor: "#e74c3c",
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                      marginRight: 8,
                    }}
                  >
                    <Ionicons name="log-out-outline" size={18} color="#fff" />
                    <Text
                      style={{
                        color: "#fff",
                        marginLeft: 8,
                        fontWeight: "600",
                      }}
                    >
                      {t("logout")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={toggleTheme}
                    style={{
                      backgroundColor: isDark ? "#444" : "#eee",
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                      marginLeft: 8,
                    }}
                    disabled={themeLoading}
                  >
                    {themeLoading ? (
                      <ActivityIndicator
                        size={16}
                        color={isDark ? "#fff" : "#000"}
                      />
                    ) : (
                      <>
                        <Ionicons
                          name={isDark ? "sunny-outline" : "moon-outline"}
                          size={18}
                          color={isDark ? "#FFD700" : "#333"}
                        />
                        <Text
                          style={{
                            color: isDark ? "#FFD700" : "#333",
                            marginLeft: 8,
                            fontWeight: "600",
                          }}
                        >
                          {isDark ? t("Light Mode") : t("Dark Mode")}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Grid Buttons Below Card */}
              <View
                style={{
                  flexDirection: "row",
                  marginTop: 20,
                  marginHorizontal: 20,
                }}
              >
                <TouchableOpacity
                  onPress={() => router.push("/profile/createplot")}
                  style={{
                    flex: 1,
                    backgroundColor: "#27ae60",
                    paddingVertical: 14,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "600",
                      fontSize: 16,
                      marginLeft: 8,
                    }}
                  >
                    {t("Create Plot")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/profile/plots")}
                  style={{
                    flex: 1,
                    backgroundColor: "#2980b9",
                    paddingVertical: 14,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 10,
                  }}
                >
                  <Ionicons name="eye-outline" size={20} color="#fff" />
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "600",
                      fontSize: 16,
                      marginLeft: 8,
                    }}
                  >
                    {t("Show Plots")}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>

        {/* Footer */}
        {/* Footer */}
        <View className="items-center py-4">
          <TouchableOpacity
            onPress={() =>
              Linking.openURL("https://farmmanagerbyvishal.netlify.app/")
            }
          >
            <Text className="text-blue-400 underline text-sm">
              Privacy Policy
            </Text>
          </TouchableOpacity>
          <Text className="text-gray-500 text-sm mb-1">
            Powered by Vishal Parmar
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
