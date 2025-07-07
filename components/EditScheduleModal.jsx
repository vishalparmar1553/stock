import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import CheckBox from "expo-checkbox";
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { Formik } from "formik";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import * as Yup from "yup";
import { auth, db } from "../firebase";

const EditScheduleModal = ({ visible, schedule, onClose, onUpdate }) => {
  const { t } = useTranslation();
  const isDark = useSelector((state) => state.user.isDark);
  const [scheduleDate, setScheduleDate] = useState(
    new Date(schedule.scheduleDate.seconds * 1000)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [dripModalVisible, setDripModalVisible] = useState(false);
  const [plotData, setPlotData] = useState(null);
  const [isCompleted, setIsCompleted] = useState(schedule.completed || false);

  const [fertilizerName, setFertilizerName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("liters");
  const [area, setArea] = useState("");

  const bgColor = isDark ? "#121212" : "#f5f5f5";
  const cardColor = isDark ? "#1f1f1f" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#000000";
  const accentColor = isDark ? "#bb86fc" : "#4CAF50";
  const inputBg = isDark ? "#2a2a2a" : "#eaeaea";

  const scheduleSchema = Yup.object()
    .shape({
      isSpray: Yup.boolean(),
      isDrip: Yup.boolean(),
      fertilizers: Yup.array().when("isSpray", {
        is: true,
        then: (schema) => schema.min(1, "Add at least one Spray item"),
      }),
      dripItems: Yup.array().when("isDrip", {
        is: true,
        then: (schema) => schema.min(1, "Add at least one Drip item"),
      }),
    })
    .test(
      "at-least-one-method",
      "Select at least one option: Spray or Drip",
      function (value) {
        return value.isSpray || value.isDrip;
      }
    );

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || scheduleDate;
    setShowDatePicker(false);
    setScheduleDate(currentDate);
  };

  const convertToLiters = (value, unit) => {
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    return unit === "liters" ? num : unit === "ml" ? num / 1000 : null;
  };

  const convertToKg = (value, unit) => {
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    return unit === "kg" ? num : unit === "g" ? num / 1000 : null;
  };

  const handleToggleComplete = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !schedule.plotId || !schedule.id) return;

    const newStatus = !isCompleted;

    try {
      const ref = doc(
        db,
        "users",
        uid,
        "plots",
        schedule.plotId,
        "schedules",
        schedule.id
      );

      const stockRef = collection(db, "users", uid, "todos");
      const stockSnap = await getDocs(stockRef);
      const stockData = {};
      stockSnap.forEach((doc) => {
        stockData[doc.data().name.toLowerCase()] = {
          id: doc.id,
          ...doc.data(),
        };
      });

      const allItems = [
        ...(schedule.sprayItems || []),
        ...(schedule.dripItems || []),
      ];

      // ✅ 1. Pre-validate all items
      for (const item of allItems) {
        const itemName = item.name.toLowerCase();
        const stock = stockData[itemName];
        const qty = parseFloat(item.finalQty || item.quantity || 0);

        if (!stock) {
          throw new Error(`Item "${item.name}" not found in stock.`);
        }

        const remaining = parseFloat(stock.remaining || 0);
        if (newStatus && remaining < qty) {
          throw new Error(`Insufficient stock for "${item.name}".`);
        }
      }

      // ✅ 2. If validation passed, proceed with batch updates
      const batchUpdates = [];

      const updateStockItem = (item, type, isDeduct) => {
        const itemName = item.name.toLowerCase();
        const stock = stockData[itemName];

        const qty = parseFloat(item.finalQty || item.quantity || 0);
        const currentRemaining = parseFloat(stock.remaining);
        const currentUsed = parseFloat(stock.used);

        const newRemaining = isDeduct
          ? currentRemaining - qty
          : currentRemaining + qty;
        const newUsed = isDeduct ? currentUsed + qty : currentUsed - qty;

        const stockDocRef = doc(db, "users", uid, "todos", stock.id);
        batchUpdates.push(
          updateDoc(stockDocRef, {
            remaining: parseFloat(newRemaining.toFixed(1)),
            used: parseFloat(newUsed.toFixed(1)),
          })
        );
      };

      if (newStatus) {
        // Deduct stock
        schedule.sprayItems?.forEach((item) =>
          updateStockItem(item, "Spray", true)
        );
        schedule.dripItems?.forEach((item) =>
          updateStockItem(item, "Drip", true)
        );
      } else {
        // Restore stock
        schedule.sprayItems?.forEach((item) =>
          updateStockItem(item, "Spray", false)
        );
        schedule.dripItems?.forEach((item) =>
          updateStockItem(item, "Drip", false)
        );
      }

      await Promise.all(batchUpdates);

      await updateDoc(ref, {
        completed: newStatus,
      });

      setIsCompleted(newStatus);

      Alert.alert(
        newStatus ? "Marked as Complete" : "Marked as Uncomplete",
        newStatus
          ? "Schedule marked as complete and stock updated."
          : "Schedule marked as incomplete and stock restored."
      );

      onUpdate();
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to update completion status.");
      console.error(e);
    }
  };

  const handleUpdate = async (values, { setSubmitting }) => {
    const uid = auth.currentUser?.uid;
    if (!uid || !schedule.plotId || !schedule.id || !plotData) return;

    const sprayTankLevel = parseFloat(plotData.sprayTankLevel || 200);
    const plotSize = parseFloat(plotData.plotSize || 1);

    const sprayItems = values.isSpray
      ? values.fertilizers.map((item) => {
          const area = parseFloat(item.area || 200);
          const baseQty =
            convertToLiters(item.quantity, item.unit) ??
            convertToKg(item.quantity, item.unit);
          const finalQty = ((baseQty / area) * sprayTankLevel).toFixed(2);
          return {
            ...item,
            finalQty: parseFloat(finalQty),
            finalUnit:
              item.unit === "ml" || item.unit === "liters"
                ? "liters"
                : item.unit === "g" || item.unit === "kg"
                ? "kg"
                : item.unit,
          };
        })
      : [];

    const dripItems = values.isDrip
      ? values.dripItems.map((item) => {
          const baseQty = parseFloat(item.quantity);
          const area = parseFloat(item.area);
          const finalQty = ((baseQty / area) * plotSize).toFixed(2);
          return {
            ...item,
            finalQty: parseFloat(finalQty),
            finalUnit: item.unit,
          };
        })
      : [];

    try {
      const ref = doc(
        db,
        "users",
        uid,
        "plots",
        schedule.plotId,
        "schedules",
        schedule.id
      );
      await updateDoc(ref, {
        scheduleDate: Timestamp.fromDate(scheduleDate),
        spray: values.isSpray,
        drip: values.isDrip,
        sprayItems,
        dripItems,
      });
      Alert.alert("Updated", "Schedule updated successfully!");
      onUpdate();
      onClose();
    } catch (e) {
      Alert.alert("Error", "Failed to update schedule.");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !schedule.plotId || !schedule.id) return;

    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this schedule?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const ref = doc(
                db,
                "users",
                uid,
                "plots",
                schedule.plotId,
                "schedules",
                schedule.id
              );
              await deleteDoc(ref);
              Alert.alert("Deleted", "Schedule deleted successfully.");
              onUpdate();
              onClose();
            } catch (error) {
              Alert.alert("Error", "Failed to delete schedule.");
              console.error(error);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    const fetchPlotData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid || !schedule.plotId) return;
      try {
        const ref = doc(db, "users", uid, "plots", schedule.plotId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setPlotData(snap.data());
        }
      } catch (err) {
        console.error("Error fetching plot data:", err);
      }
    };

    if (visible) fetchPlotData();
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide">
      <Formik
        initialValues={{
          isSpray: schedule.spray,
          isDrip: schedule.drip,
          fertilizers: schedule.sprayItems || [],
          dripItems: schedule.dripItems || [],
        }}
        validationSchema={scheduleSchema}
        onSubmit={handleUpdate}
      >
        {({
          handleSubmit,
          setFieldValue,
          values,
          isSubmitting,
          errors,
          submitCount,
        }) => (
          <ScrollView
            contentContainerStyle={{
              backgroundColor: bgColor,
              padding: 20,
              paddingBottom: 50,
            }}
          >
            <View
              style={{
                backgroundColor: cardColor,
                borderRadius: 16,
                padding: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "bold",
                  color: accentColor,
                  marginBottom: 12,
                }}
              >
                {plotData?.plotName || "Loading..."}
              </Text>
              <Text style={{ fontSize: 16, color: textColor }}>
                {t("Schedule_Date")}:{" "}
                <Text style={{ fontWeight: "600" }}>
                  {scheduleDate.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={{
                  backgroundColor: accentColor,
                  padding: 12,
                  borderRadius: 8,
                  alignItems: "center",
                  marginVertical: 20,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  {t("Select Schedule Date")}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={scheduleDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onChangeDate}
                />
              )}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <CheckBox
                  value={values.isSpray}
                  onValueChange={(val) => setFieldValue("isSpray", val)}
                  color={values.isSpray ? accentColor : undefined}
                />
                <Text
                  style={{ marginLeft: 10, color: textColor, fontSize: 23 }}
                >
                  {t("Spray")}
                </Text>
              </View>
              {values.isSpray && (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      setArea("200");
                      setModalVisible(true);
                    }}
                    style={{
                      backgroundColor: accentColor,
                      padding: 10,
                      borderRadius: 8,
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      {t("Add Fertilizer")}
                    </Text>
                  </TouchableOpacity>
                  {values.fertilizers.map((item, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ color: textColor }}>{item.name}</Text>
                      <Text style={{ color: textColor }}>
                        {item.quantity} {item.unit} / {item.area}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          setFieldValue(
                            "fertilizers",
                            values.fertilizers.filter((_, i) => i !== index)
                          )
                        }
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color={accentColor}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginVertical: 10,
                }}
              >
                <CheckBox
                  value={values.isDrip}
                  onValueChange={(val) => setFieldValue("isDrip", val)}
                  color={values.isDrip ? accentColor : undefined}
                />
                <Text
                  style={{ marginLeft: 10, color: textColor, fontSize: 23 }}
                >
                  {t("Drip")}
                </Text>
              </View>
              {values.isDrip && (
                <>
                  <TouchableOpacity
                    onPress={() => setDripModalVisible(true)}
                    style={{
                      backgroundColor: accentColor,
                      padding: 10,
                      borderRadius: 8,
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      {t("Add Fertilizer")}
                    </Text>
                  </TouchableOpacity>
                  {values.dripItems.map((item, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ color: textColor }}>{item.name}</Text>
                      <Text style={{ color: textColor }}>
                        {item.quantity} {item.unit} / {item.area}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          setFieldValue(
                            "dripItems",
                            values.dripItems.filter((_, i) => i !== index)
                          )
                        }
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color={accentColor}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}
              {errors["at-least-one-method"] && submitCount > 0 && (
                <Text style={{ color: "red", marginBottom: 10 }}>
                  {errors["at-least-one-method"]}
                </Text>
              )}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting || (!values.isSpray && !values.isDrip)}
                style={{
                  marginTop: 30,
                  backgroundColor:
                    !values.isSpray && !values.isDrip ? "grey" : accentColor,
                  padding: 14,
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
                >
                  {isSubmitting ? (
                    <Text>{t("Saving...")}</Text>
                  ) : (
                    <Text>{t("Save Schedule")}</Text>
                  )}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                style={{ marginTop: 15, alignItems: "center" }}
              >
                <Text style={{ color: accentColor, fontSize: 16 }}>
                  {t("Cancel")}
                </Text>
              </TouchableOpacity>
              <View>
                <TouchableOpacity
                  onPress={handleToggleComplete}
                  style={{
                    backgroundColor: isCompleted ? "#E53935" : "#43A047",
                    padding: 12,
                    borderRadius: 10,
                    alignItems: "center",
                    marginTop: 20,
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
                  >
                    {isCompleted
                      ? t("Mark as Uncomplete")
                      : t("Mark as Complete")}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={handleDelete}
                style={{ marginTop: 10, alignItems: "center" }}
              >
                <Text style={{ color: "red", fontSize: 16 }}>
                  {t("Delete Schedule")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Add Fertilizer / Drip Modal */}
            <Modal
              visible={modalVisible || dripModalVisible}
              animationType="slide"
              transparent
            >
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
                    padding: 20,
                    borderRadius: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: accentColor,
                      marginBottom: 12,
                    }}
                  >
                    {modalVisible ? t("Add Fertilizer") : t("Add Fertilizer")}
                  </Text>

                  <Text style={{ color: textColor }}>{t("Name")}</Text>
                  <TextInput
                    placeholder={t("Name")}
                    placeholderTextColor="#888"
                    style={{
                      backgroundColor: inputBg,
                      color: textColor,
                      padding: 10,
                      borderRadius: 8,
                      marginBottom: 10,
                    }}
                    value={fertilizerName}
                    onChangeText={setFertilizerName}
                  />

                  <Text style={{ color: textColor }}>{t("Quantity")}</Text>
                  <TextInput
                    placeholder={t("Quantity")}
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    style={{
                      backgroundColor: inputBg,
                      color: textColor,
                      padding: 10,
                      borderRadius: 8,
                      marginBottom: 10,
                    }}
                    value={quantity}
                    onChangeText={setQuantity}
                  />

                  <Text style={{ color: textColor }}>{t("Unit")}</Text>
                  <View
                    style={{
                      backgroundColor: inputBg,
                      borderRadius: 8,
                      marginBottom: 10,
                    }}
                  >
                    <Picker
                      selectedValue={quantityUnit}
                      onValueChange={setQuantityUnit}
                      style={{ color: textColor }}
                      dropdownIconColor={accentColor}
                    >
                      <Picker.Item label="Liters" value="liters" />
                      <Picker.Item label="Milliliters" value="ml" />
                      <Picker.Item label="Kilograms" value="kg" />
                      <Picker.Item label="Grams" value="g" />
                    </Picker>
                  </View>

                  {dripModalVisible && (
                    <>
                      <Text style={{ color: textColor }}>
                        {t("Area (acres)")}
                      </Text>
                      <TextInput
                        placeholder={t("Area")}
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                        style={{
                          backgroundColor: inputBg,
                          color: textColor,
                          padding: 10,
                          borderRadius: 8,
                        }}
                        value={area}
                        onChangeText={setArea}
                      />
                    </>
                  )}

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: 20,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setModalVisible(false);
                        setDripModalVisible(false);
                        setFertilizerName("");
                        setQuantity("");
                        setArea("");
                      }}
                      style={{
                        padding: 10,
                        backgroundColor: "#999",
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: "#fff" }}>{t("Cancel")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const newItem = {
                          name: fertilizerName,
                          quantity,
                          unit: quantityUnit,
                          area: dripModalVisible ? area : "200",
                        };
                        if (modalVisible) {
                          setFieldValue("fertilizers", [
                            ...values.fertilizers,
                            newItem,
                          ]);
                          setModalVisible(false);
                        } else {
                          setFieldValue("dripItems", [
                            ...values.dripItems,
                            newItem,
                          ]);
                          setDripModalVisible(false);
                        }
                        setFertilizerName("");
                        setQuantity("");
                        setArea("");
                      }}
                      style={{
                        padding: 10,
                        backgroundColor: accentColor,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: "#fff" }}>{t("Add")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </ScrollView>
        )}
      </Formik>
    </Modal>
  );
};

export default EditScheduleModal;
