import { Ionicons } from "@expo/vector-icons";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { auth, db } from "../../firebase";

export default function Home() {
  const { t } = useTranslation();
  const [userName, setUserName] = useState("");
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUseModalVisible, setIsUseModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [useValue, setUseValue] = useState("");
  const [addValue, setAddValue] = useState("");
  const [newName, setNewName] = useState("");
  const [newRemaining, setNewRemaining] = useState("");
  const [newUsed, setNewUsed] = useState("0");
  const [newUnit, setNewUnit] = useState("");
  const [addingTodo, setAddingTodo] = useState(false);
  const [searchText, setSearchText] = useState("");

  const isDark = useSelector((state) => state.user.isDark);

  const bgColor = isDark ? "#2b2b2b" : "#f5f5f5";
  const cardColor = isDark ? "#3b3b3b" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#000000";
  const borderColor = isDark ? "#666" : "#ccc";
  const stockColor = isDark ? "#46f073" : "#08bd37";

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const userRef = doc(db, "users", uid);
    const todosRef = collection(userRef, "todos");

    // Get user name once
    getDoc(userRef).then((userDoc) => {
      if (userDoc.exists()) {
        setUserName(userDoc.data().name || "User");
      }
    });

    // Real-time todos listener
    const unsubscribe = onSnapshot(todosRef, (snapshot) => {
      const todosList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTodos(todosList.reverse());
      setLoading(false);
    });

    // Cleanup on unmount
    return () => unsubscribe();
  }, []);

  const filteredTodos = todos.filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleUse = (item) => {
    setSelectedItem(item);
    setUseValue("");
    setIsUseModalVisible(true);
  };

  const handleAddMore = (item) => {
    setSelectedItem(item);
    setAddValue("");
    setIsAddModalVisible(true);
  };

  const isValidOneDecimal = (value) => /^(\d+(\.\d{1})?)$/.test(value);

  const handleDelete = (item) => {
    Alert.alert("Delete", `Delete "${item.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const uid = auth.currentUser?.uid;
            if (!uid) return;
            await deleteDoc(doc(db, "users", uid, "todos", item.id));
          } catch {
            Alert.alert("Error", "Delete failed.");
          }
        },
      },
    ]);
  };

  const handleUseSubmit = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !selectedItem) return;

    if (!isValidOneDecimal(useValue))
      return Alert.alert("Invalid", "Enter a valid number (1 decimal max)");

    const value = parseFloat(parseFloat(useValue).toFixed(1));

    if (value <= 0) return Alert.alert("Invalid", "Value must be > 0");
    if (value > Number(selectedItem.remaining))
      return Alert.alert("Not enough remaining");

    try {
      const todoRef = doc(db, "users", uid, "todos", selectedItem.id);
      const newUsed = parseFloat(
        (Number(selectedItem.used) + value).toFixed(1)
      );
      const newRemaining = parseFloat(
        (Number(selectedItem.remaining) - value).toFixed(1)
      );

      if (newRemaining <= 0) {
        await deleteDoc(todoRef);
      } else {
        await updateDoc(todoRef, { used: newUsed, remaining: newRemaining });
      }

      setIsUseModalVisible(false);
    } catch {
      Alert.alert("Error", "Update failed.");
    }
  };

  const handleAddSubmit = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !selectedItem) return;

    if (!isValidOneDecimal(addValue))
      return Alert.alert("Invalid", "Enter a valid number (1 decimal max)");

    const value = parseFloat(parseFloat(addValue).toFixed(1));
    if (value <= 0) return Alert.alert("Invalid", "Value must be > 0");

    try {
      const todoRef = doc(db, "users", uid, "todos", selectedItem.id);
      const newRemaining = parseFloat(
        (Number(selectedItem.remaining) + value).toFixed(1)
      );
      await updateDoc(todoRef, { remaining: newRemaining });

      setIsAddModalVisible(false);
    } catch {
      Alert.alert("Error", "Add failed.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={bgColor}
      />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Sticky Header */}
        <View
          style={{
            backgroundColor: bgColor,
            zIndex: 10,
            paddingHorizontal: 16,
          }}
        >
          {/* Search Input */}
          <View
            className="mb-3 flex-row items-center"
            style={{
              backgroundColor: isDark ? "#444" : "#fff",
              borderColor,
              borderWidth: 1,
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 8,
            }}
          >
            <Ionicons
              name="search"
              size={20}
              color={isDark ? "#ccc" : "#555"}
              style={{ marginRight: 8 }}
            />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder={t("Search item name...")}
              placeholderTextColor={isDark ? "#aaa" : "#666"}
              style={{
                flex: 1,
                color: textColor,
              }}
            />
          </View>
        </View>

        {/* Scrollable content */}
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
        >
          <View className="flex-row items-center justify-center">
            <View className="flex-1 h-px bg-gray-400" />
            <Text
              style={{ color: textColor }}
              className="px-2 font-semibold text-xl"
            >
              📦 {t("Available Stock")}
            </Text>
            <View className="flex-1 h-px bg-gray-400" />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#fb9b33" className="mt-10" />
          ) : filteredTodos.length === 0 ? (
            <Text
              style={{ color: textColor }}
              className="text-center mt-10 text-lg"
            >
              No matching items found.
            </Text>
          ) : (
            filteredTodos.map((item) => (
              <View
                key={item.id}
                style={{ backgroundColor: cardColor, borderColor }}
                className="p-4 mt-5 rounded-xl shadow-sm border"
              >
                <Text
                  style={{ color: textColor }}
                  className="text-4xl font-bold"
                >
                  {item.name}
                </Text>
                <Text
                  style={{ color: stockColor }}
                  className="mt-2 text-xl font-semibold"
                >
                  {t("Stock")}:{" "}
                  <Text className="text-2xl font-bold underline">
                    {item.remaining}
                  </Text>{" "}
                  {item.unit}
                </Text>
                <Text
                  style={{ color: "red" }}
                  className="text-lg font-semibold"
                >
                  {t("Used")}: {item.used} {item.unit}
                </Text>

                <View className="flex-row justify-between mt-4 w-full space-x-2">
                  <TouchableOpacity
                    onPress={() => handleDelete(item)}
                    className="bg-red-500 px-4 py-2 rounded flex-row items-center space-x-1"
                  >
                    <Ionicons name="trash" size={18} color="#fff" />
                    <Text className="text-white font-medium">
                      {t("Delete")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleAddMore(item)}
                    className="bg-blue-500 px-4 py-2 rounded flex-row items-center space-x-1"
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={18}
                      color="#fff"
                    />
                    <Text className="text-white font-medium">{t("Add")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleUse(item)}
                    className="bg-yellow-600 px-4 py-2 rounded flex-row items-center space-x-1"
                  >
                    <Ionicons name="flash" size={18} color="#fff" />
                    <Text className="text-white font-medium">{t("Use")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Floating Action Button */}
        <TouchableOpacity
          onPress={() => setIsCreateModalVisible(true)}
          style={{
            position: "absolute",
            right: 20,
            bottom: Platform.OS === "android" ? 20 : 30,
            backgroundColor: "#fb9b33",
            borderRadius: 30,
            width: 60,
            height: 60,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>

        {/* Use Modal */}
        <Modal transparent visible={isUseModalVisible} animationType="fade">
          <View className="flex-1 bg-black bg-opacity-50 justify-center items-center">
            <View className="bg-white w-11/12 rounded-xl p-5">
              <Text className="text-black text-lg font-semibold mb-3 flex-row items-center">
                {t("Use quantity for")} {selectedItem?.name}
              </Text>
              <TextInput
                value={useValue}
                onChangeText={setUseValue}
                placeholder={t("Enter value")}
                keyboardType="numeric"
                className="border border-gray-300 rounded p-3 mb-4 text-black"
              />
              <View className="flex-row justify-end space-x-3">
                <TouchableOpacity
                  onPress={() => setIsUseModalVisible(false)}
                  className="px-4 mr-4 py-2 rounded bg-gray-400"
                >
                  <Text className="text-white font-medium">{t("Cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleUseSubmit}
                  className="px-4 py-2 rounded bg-yellow-600"
                >
                  <Text className="text-white font-medium">{t("Use")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Modal */}
        <Modal transparent visible={isAddModalVisible} animationType="fade">
          <View className="flex-1 bg-black bg-opacity-50 justify-center items-center">
            <View className="bg-white w-11/12 rounded-xl p-5">
              <Text className="text-black text-lg font-semibold mb-3 flex-row items-center">
                <Text>
                  {t("Add quantity to")} {selectedItem?.name}
                </Text>
              </Text>
              <TextInput
                value={addValue}
                onChangeText={setAddValue}
                placeholder={t("Enter value")}
                keyboardType="numeric"
                className="border border-gray-300 rounded p-3 mb-4 text-black"
              />
              <View className="flex-row justify-end space-x-3">
                <TouchableOpacity
                  onPress={() => setIsAddModalVisible(false)}
                  className="px-4 mr-4 py-2 rounded bg-gray-400"
                >
                  <Text className="text-white font-medium">{t("Cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddSubmit}
                  className="px-4 py-2 rounded bg-yellow-600"
                >
                  <Text className="text-white font-medium">{t("Add")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Create Modal */}
        <Modal transparent visible={isCreateModalVisible} animationType="slide">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-black bg-opacity-50 justify-center items-center">
              <View className="bg-white w-11/12 rounded-xl p-5">
                <Text className="text-black text-lg font-bold mb-3 text-center flex-row items-center justify-center">
                  {t("Add New Item")}
                </Text>
                <TextInput
                  className="bg-white border border-gray-300 rounded p-3 mb-3 text-black"
                  placeholder={t("Name")}
                  placeholderTextColor="#999"
                  value={newName}
                  onChangeText={setNewName}
                />
                <TextInput
                  className="bg-white border border-gray-300 rounded p-3 mb-3 text-black"
                  placeholder={t("Stock")}
                  placeholderTextColor="#999"
                  value={newRemaining}
                  onChangeText={setNewRemaining}
                  keyboardType="numeric"
                />
                <TextInput
                  className="bg-white border border-gray-300 rounded p-3 mb-3 text-black"
                  placeholder="Used"
                  placeholderTextColor="#999"
                  value={newUsed}
                  onChangeText={setNewUsed}
                  keyboardType="numeric"
                  style={{ display: "none" }}
                />
                <View className="border p-0 border-gray-300 rounded mb-4">
                  <RNPickerSelect
                    value={newUnit}
                    onValueChange={setNewUnit}
                    placeholder={{ label: t("Select unit..."), value: null }}
                    items={[
                      { label: "kg", value: "kg" },
                      { label: "gram", value: "gram" },
                      { label: "liter", value: "liter" },
                      { label: "ml", value: "ml" },
                    ]}
                    useNativeAndroidPickerStyle={false}
                    style={{
                      inputIOS: {
                        padding: 12,
                        color: "#000",
                      },
                      inputAndroid: {
                        padding: 12,
                        color: "#000",
                      },
                      placeholder: {
                        color: "#999",
                      },
                    }}
                  />
                </View>

                <View className="flex-row justify-end space-x-3">
                  <TouchableOpacity
                    onPress={() => setIsCreateModalVisible(false)}
                    className="px-4 mr-4 py-2 rounded bg-gray-400"
                  >
                    <Text className="text-white font-medium">
                      {t("Cancel")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      if (!newName || !newRemaining || !newUsed || !newUnit) {
                        Alert.alert("Error", "All fields are required.");
                        return; // ⛔ Exit early if validation fails
                      }
                      try {
                        setAddingTodo(true);
                        const uid = auth.currentUser?.uid;
                        if (!uid) return;

                        const todoRef = collection(
                          doc(db, "users", uid),
                          "todos"
                        );
                        await addDoc(todoRef, {
                          name: newName,
                          remaining: Math.floor(Number(newRemaining)),
                          used: Math.floor(Number(newUsed)),
                          unit: newUnit,
                          createdAt: new Date(),
                        });

                        Alert.alert("Success", "Item added.");
                        setNewName("");
                        setNewRemaining("");
                        setNewUsed("0");
                        setNewUnit("");
                        setIsCreateModalVisible(false);
                      } catch {
                        Alert.alert("Error", "Add failed.");
                      } finally {
                        setAddingTodo(false);
                      }
                    }}
                    className="px-4 py-2 rounded bg-[#f49b33]"
                  >
                    {addingTodo ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white font-medium">
                        {t("Save")}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
