import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { Formik } from "formik";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useSelector } from "react-redux";
import * as Yup from "yup";
import { auth, db } from "../../../firebase";

// Validation Schema
const PlotSchema = Yup.object().shape({
  plotName: Yup.string()
    .trim()
    .max(20, "Plot name must be 20 characters or less")
    .required("Plot name is required"),
  plotSize: Yup.string()
    .max(20, "Plot size must be 20 characters or less")
    .required("Plot size is required"),
  location: Yup.string()
    .max(20, "Location must be 20 characters or less")
    .required("Location is required"),
  sprayTankLevel: Yup.string()
    .max(20, "Spray tank level  must be 20 characters or less")
    .required("Spray tank level is required"),
});

export default function CreatePlot() {
  const { t } = useTranslation();
  const router = useRouter();
  const isDark = useSelector((state) => state.user.isDark);

  const [startDate, setStartDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const bgColor = isDark ? "#121212" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#000000";
  const inputBg = isDark ? "#1e1e1e" : "#f0f0f0";

  const onChangeDate = (event, selectedDate) => {
    setShowPicker(Platform.OS === "ios");
    if (selectedDate) setStartDate(selectedDate);
  };

  const handleSave = async (values) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setLoading(true);

    try {
      const plotsRef = collection(db, "users", uid, "plots");
      const q = query(
        plotsRef,
        where("plotName", "==", values.plotName.trim())
      );
      const existing = await getDocs(q);

      if (!existing.empty) {
        alert("A plot with this name already exists.");
        setLoading(false);
        return;
      }

      await addDoc(plotsRef, {
        ...values,
        plotName: values.plotName.trim(),
        sessionStart: startDate.toISOString(),
        createdAt: new Date().toISOString(),
      });

      router.back();
    } catch (error) {
      console.error("Error saving plot:", error);
      alert("Failed to save plot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={bgColor}
      />

      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            marginBottom: 20,
            color: textColor,
            marginTop: 15,
          }}
        >
          {t("Create New Plot")}
        </Text>

        <Formik
          initialValues={{
            plotName: "",
            plotSize: "",
            location: "",
            sprayTankLevel: "",
          }}
          validationSchema={PlotSchema}
          onSubmit={handleSave}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <>
              {/* Plot Name */}
              <TextInput
                value={values.plotName}
                onChangeText={handleChange("plotName")}
                onBlur={handleBlur("plotName")}
                placeholder={t("Name")}
                placeholderTextColor={isDark ? "#aaa" : "#888"}
                style={{
                  backgroundColor: inputBg,
                  padding: 14,
                  borderRadius: 10,
                  marginBottom: 5,
                  color: textColor,
                }}
              />
              {touched.plotName && errors.plotName && (
                <Text style={{ color: "red", marginBottom: 10 }}>
                  {errors.plotName}
                </Text>
              )}

              {/* Plot Size */}
              <TextInput
                value={values.plotSize}
                onChangeText={handleChange("plotSize")}
                onBlur={handleBlur("plotSize")}
                placeholder={t("Area (acres)")}
                placeholderTextColor={isDark ? "#aaa" : "#888"}
                keyboardType="decimal-pad"
                style={{
                  backgroundColor: inputBg,
                  padding: 14,
                  borderRadius: 10,
                  marginBottom: 5,
                  color: textColor,
                }}
              />
              {touched.plotSize && errors.plotSize && (
                <Text style={{ color: "red", marginBottom: 10 }}>
                  {errors.plotSize}
                </Text>
              )}

              {/* Location */}
              <TextInput
                value={values.location}
                onChangeText={handleChange("location")}
                onBlur={handleBlur("location")}
                placeholder={t("Location")}
                placeholderTextColor={isDark ? "#aaa" : "#888"}
                style={{
                  backgroundColor: inputBg,
                  padding: 14,
                  borderRadius: 10,
                  marginBottom: 5,
                  color: textColor,
                }}
              />
              {touched.location && errors.location && (
                <Text style={{ color: "red", marginBottom: 10 }}>
                  {errors.location}
                </Text>
              )}

              {/* Spray Tank Level */}
              <TextInput
                value={values.sprayTankLevel}
                onChangeText={handleChange("sprayTankLevel")}
                onBlur={handleBlur("sprayTankLevel")}
                placeholder={t("Spray Tank Level (e.g., 20 L)")}
                placeholderTextColor={isDark ? "#aaa" : "#888"}
                keyboardType="numeric"
                style={{
                  backgroundColor: inputBg,
                  padding: 14,
                  borderRadius: 10,
                  marginBottom: 5,
                  color: textColor,
                }}
              />
              {touched.sprayTankLevel && errors.sprayTankLevel && (
                <Text style={{ color: "red", marginBottom: 10 }}>
                  {errors.sprayTankLevel}
                </Text>
              )}

              {/* Start Date */}
              <TouchableOpacity
                onPress={() => setShowPicker(true)}
                style={{
                  backgroundColor: inputBg,
                  padding: 14,
                  borderRadius: 10,
                  marginBottom: 15,
                }}
              >
                <Text style={{ color: textColor }}>
                  {`${t("Session Start:")} ${startDate.toDateString()}`}
                </Text>
              </TouchableOpacity>

              {showPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={onChangeDate}
                />
              )}

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={{
                  backgroundColor: "#27ae60",
                  paddingVertical: 14,
                  borderRadius: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "600",
                    marginLeft: 10,
                  }}
                >
                  {loading ? t("Saving...") : t("Save")}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Formik>
      </ScrollView>
    </SafeAreaView>
  );
}
