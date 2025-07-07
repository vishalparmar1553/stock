import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import CheckBox from "expo-checkbox";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, doc, getDoc, Timestamp } from "firebase/firestore";
import { Formik } from "formik";
import { useEffect, useState } from "react";
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
import * as Yup from "yup";
import { auth, db } from "../../../firebase";

export default function PlotDetail() {
  const { plotid } = useLocalSearchParams();
  const isDark = useSelector((state) => state.user.isDark);
  const router = useRouter();

  const [plot, setPlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [dripModalVisible, setDripModalVisible] = useState(false);

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
      (values) => values.isSpray || values.isDrip
    );

  useEffect(() => {
    const fetchPlot = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid || !plotid) return;
        const docRef = doc(db, "users", uid, "plots", plotid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setPlot(docSnap.data());
      } catch (err) {
        console.error("Failed to fetch plot", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlot();
  }, [plotid]);

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

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: bgColor,
        }}
      >
        <ActivityIndicator size="large" color={accentColor} />
      </SafeAreaView>
    );
  }

  if (!plot) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: bgColor,
        }}
      >
        <Text style={{ color: textColor }}>Plot not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={bgColor}
      />
      <Formik
        initialValues={{
          isSpray: false,
          isDrip: false,
          fertilizers: [],
          dripItems: [],
        }}
        validationSchema={scheduleSchema}
        onSubmit={async (values, { setSubmitting }) => {
          const uid = auth.currentUser?.uid;
          if (!uid || !plotid) return;

          const sprayTankLevel = parseFloat(plot?.sprayTankLevel || 200);
          const plotSize = parseFloat(plot?.plotSize || 0);

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
                    item.unit === "ml"
                      ? "liters"
                      : item.unit === "g"
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
            await addDoc(
              collection(db, "users", uid, "plots", plotid, "schedules"),
              {
                plotName: plot.plotName,
                scheduleDate: Timestamp.fromDate(scheduleDate),
                spray: values.isSpray,
                drip: values.isDrip,
                sprayItems,
                dripItems,
              }
            );
            Alert.alert("Success", "Schedule saved!");
            router.push("/(tabs)");
          } catch (e) {
            Alert.alert("Error", "Failed to save schedule.");
            console.error(e);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ handleSubmit, setFieldValue, values, isSubmitting, errors }) => (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
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
                {plot.plotName}
              </Text>

              <Text style={{ fontSize: 16, color: textColor }}>
                Schedule Date:{" "}
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
                  Select Schedule Date
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
                <Text style={{ marginLeft: 10, color: textColor }}>Spray</Text>
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
                      Add Fertilizer
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
                <Text style={{ marginLeft: 10, color: textColor }}>Drip</Text>
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
                      Add Drip Item
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

              {/* Show Form Error if Both Unchecked */}
              {"at-least-one-method" in errors && (
                <Text style={{ color: "red", marginTop: 10 }}>
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
                  {isSubmitting ? "Saving..." : "Save Schedule"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* MODAL SHARED */}
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
                    {modalVisible ? "Add Fertilizer" : "Add Drip Item"}
                  </Text>

                  <Text style={{ color: textColor }}>Name</Text>
                  <TextInput
                    placeholder="Name"
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

                  <Text style={{ color: textColor }}>Quantity</Text>
                  <TextInput
                    placeholder="Quantity"
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

                  <Text style={{ color: textColor }}>Unit</Text>
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
                      <Text style={{ color: textColor }}>Area (acres)</Text>
                      <TextInput
                        placeholder="Area"
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
                      <Text style={{ color: "#fff" }}>Cancel</Text>
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
                      <Text style={{ color: "#fff" }}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </ScrollView>
        )}
      </Formik>
    </SafeAreaView>
  );
}
