import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Colors } from "../../assets/Colors";

export default function TabLayout() {
  const reduxIsDark = useSelector((state) => state.user.isDark);
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.PRIMARY,
        tabBarInactiveTintColor: reduxIsDark
          ? Colors.dark.text
          : Colors.light.text,
        tabBarStyle: {
          backgroundColor: reduxIsDark
            ? Colors.dark.background
            : Colors.light.background,
          paddingBottom: 14,
          height: 75,
          borderTopColor: reduxIsDark ? "#333" : "#ccc",
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "bold" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("Home"),
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: t("Stock"),
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="cubes" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="schedules"
        options={{
          title: t("Schedules"),
          tabBarIcon: ({ color }) => (
            <FontAwesome name="calendar" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t("Account"),
          tabBarIcon: ({ color }) => (
            <FontAwesome name="money" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("Profile"),
          tabBarIcon: ({ color }) => (
            <FontAwesome name="user-circle-o" color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
