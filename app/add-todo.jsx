import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { addDoc, collection, doc } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../firebase";

export default function AddTodo() {
  const [name, setName] = useState("");
  const [remaining, setRemaining] = useState("");
  const [used, setUsed] = useState("0"); // Default value set to "0"
  const [unit, setUnit] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleAddTodo = async () => {
    if (!name || !remaining || !used || !unit) {
      return Alert.alert("All fields are required.");
    }

    try {
      setLoading(true);
      const uid = auth.currentUser?.uid;
      if (!uid) return Alert.alert("User not logged in.");

      const todoRef = collection(doc(db, "users", uid), "todos");

      await addDoc(todoRef, {
        name,
        remaining,
        used,
        unit,
        createdAt: new Date(),
      });

      Alert.alert("Success", "Todo added successfully!");

      setName("");
      setRemaining("");
      setUsed("0"); // Reset to default "0"
      setUnit("");

      router.replace("/(tabs)/home");
    } catch (error) {
      console.error("Error adding todo:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#2b2b2b] px-4">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingVertical: 40 }}
        >
          <Text className="text-white text-2xl font-bold mb-6 text-center">
            Add New Todo
          </Text>

          <TextInput
            className="rounded-lg p-3 mb-4"
            placeholder="Item Name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            style={{ backgroundColor: "white", color: "black" }}
          />
          <TextInput
            className="rounded-lg p-3 mb-4"
            placeholder="Remaining"
            placeholderTextColor="#999"
            value={remaining}
            onChangeText={setRemaining}
            keyboardType="numeric"
            style={{ backgroundColor: "white", color: "black" }}
          />
          <TextInput
            className="rounded-lg p-3 mb-4"
            placeholder="Used"
            placeholderTextColor="#999"
            value={used}
            onChangeText={setUsed}
            keyboardType="numeric"
            style={{ backgroundColor: "white", color: "black" }}
          />
          <TextInput
            className="rounded-lg p-3 mb-6"
            placeholder="Unit (e.g., pcs, kg, litre)"
            placeholderTextColor="#999"
            value={unit}
            onChangeText={setUnit}
            style={{ backgroundColor: "white", color: "black" }}
          />

          <TouchableOpacity
            onPress={handleAddTodo}
            disabled={loading}
            className={`${
              loading ? "bg-[#f49b33]/60" : "bg-[#f49b33]"
            } p-3 rounded-lg flex-row items-center justify-center`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={22} color="#fff" />
                <Text className="text-white text-lg font-semibold ml-2">
                  Save Todo
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
