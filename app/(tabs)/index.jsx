import { useIsFocused } from "@react-navigation/native";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import EditScheduleModal from "../../components/EditScheduleModal";
import { auth, db } from "../../firebase";

export default function UserSchedules() {
  const isDark = useSelector((state) => state.user.isDark);
  const [schedules, setSchedules] = useState({ all: [], filtered: [] });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [filter, setFilter] = useState("Today");
  const [todos, setTodos] = useState([]);

  const isFocused = useIsFocused();
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const bgColor = isDark ? "#121212" : "#f5f5f5";
  const cardColor = isDark ? "#1f1f1f" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#000000";
  const accentColor = isDark ? "#bb86fc" : "#4CAF50";
  const filters = ["Today", "Upcoming", "Completed", "Not Completed"];

  const applyFilter = (filterType, all) => {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    let filtered = all;
    if (filterType === "Today") {
      filtered = all.filter((s) => {
        const d = s.scheduleDate?.toDate?.();
        return d && d >= startOfToday && d <= endOfToday;
      });
    } else if (filterType === "Upcoming") {
      filtered = all.filter((s) => {
        const d = s.scheduleDate?.toDate?.();
        return d && d > endOfToday;
      });
    } else if (filterType === "Completed") {
      filtered = all.filter((s) => s.completed === true);
    } else if (filterType === "Not Completed") {
      filtered = all.filter((s) => !s.completed);
    }

    setSchedules({ all, filtered });
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        setUserName(userSnap.data()?.name || "");
      }

      const plotsSnapshot = await getDocs(
        collection(db, "users", uid, "plots")
      );
      let allSchedules = [];

      for (const plotDoc of plotsSnapshot.docs) {
        const plotId = plotDoc.id;
        const plotName = plotDoc.data().plotName;

        const schedulesSnapshot = await getDocs(
          collection(db, "users", uid, "plots", plotId, "schedules")
        );

        schedulesSnapshot.forEach((scheduleDoc) => {
          const data = scheduleDoc.data();
          allSchedules.push({ id: scheduleDoc.id, plotId, plotName, ...data });
        });
      }

      const todosSnap = await getDocs(
        collection(doc(db, "users", uid), "todos")
      );
      const todosList = todosSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTodos(todosList);

      allSchedules.sort(
        (a, b) => a.scheduleDate?.toDate?.() - b.scheduleDate?.toDate?.()
      );
      applyFilter(filter, allSchedules);
    } catch (err) {
      console.error("Error fetching schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) fetchSchedules();
  }, [isFocused]);

  const handleFilterChange = (type) => {
    setFilter(type);
    applyFilter(type, schedules.all);
  };

  const closeModal = () => setSelectedSchedule(null);
  const handleUpdate = () => {
    fetchSchedules();
    closeModal();
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={bgColor}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 30,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            color: textColor,
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 10,
          }}
        >
          👋 Welcome, {userName}
        </Text>

        <FlatList
          data={filters}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={{
            paddingVertical: 4,
            gap: 8,
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleFilterChange(item)}
              style={{
                backgroundColor: filter === item ? accentColor : "#ccc",
                height: 36,
                justifyContent: "center",
                paddingHorizontal: 14,
                borderRadius: 18,
              }}
            >
              <Text
                style={{
                  color: filter === item ? "#fff" : "#000",
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        <View style={{ marginTop: 16 }}>
          {schedules.filtered.length === 0 ? (
            <Text
              style={{ color: textColor, fontSize: 16, textAlign: "center" }}
            >
              No schedules found for &quot;{filter}&ldquo;
            </Text>
          ) : (
            // Dynamic stock logic here
            (() => {
              const stockMap = {};
              todos.forEach((item) => {
                stockMap[item.name.toLowerCase()] = item.remaining;
              });

              const sortedSchedules = [...schedules.filtered].sort(
                (a, b) =>
                  a.scheduleDate?.toDate?.() - b.scheduleDate?.toDate?.()
              );

              return sortedSchedules.map((schedule) => {
                const snapshotStock = {};
                const reduceStock = (items) => {
                  items?.forEach((item) => {
                    const key = item.name.toLowerCase();
                    const required = parseFloat(item.finalQty || 0);
                    const stockTodo = todos.find(
                      (t) => t.name.toLowerCase() === key
                    );
                    const available = stockMap[key] ?? 0;
                    const unit = stockTodo?.unit || "";

                    snapshotStock[key] = {
                      remaining: available,
                      unit,
                    };

                    stockMap[key] = Math.max(0, available - required);
                  });
                };

                if (schedule.spray) reduceStock(schedule.sprayItems);
                if (schedule.drip) reduceStock(schedule.dripItems);

                const scheduleTodos = Object.entries(snapshotStock).map(
                  ([name, remaining]) => ({
                    name,
                    remaining,
                  })
                );

                return (
                  <TouchableOpacity
                    key={schedule.id}
                    onPress={() => setSelectedSchedule(schedule)}
                  >
                    <ScheduleCard
                      schedule={schedule}
                      cardColor={cardColor}
                      textColor={textColor}
                      accentColor={accentColor}
                      todos={scheduleTodos}
                    />
                  </TouchableOpacity>
                );
              });
            })()
          )}
        </View>
      </ScrollView>

      {selectedSchedule && (
        <EditScheduleModal
          visible={!!selectedSchedule}
          schedule={selectedSchedule}
          onClose={closeModal}
          onUpdate={handleUpdate}
        />
      )}
    </SafeAreaView>
  );
}

const ScheduleCard = ({
  schedule,
  cardColor,
  textColor,
  accentColor,
  todos,
}) => {
  const scheduleDateStr = schedule.scheduleDate
    ?.toDate?.()
    .toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <View
      style={{
        backgroundColor: cardColor,
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: accentColor, fontWeight: "bold", fontSize: 18 }}
          >
            {schedule.plotName}
          </Text>
          <Text style={{ color: "#888", fontSize: 12 }}>
            📅 {scheduleDateStr}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: schedule.completed ? "#4caf50" : "#f44336",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 20,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 12 }}>
            {schedule.completed ? "Completed" : "Pending"}
          </Text>
        </View>
      </View>

      {schedule.spray && schedule.sprayItems?.length > 0 && (
        <ItemList
          title="Spray Items"
          items={schedule.sprayItems}
          textColor={textColor}
          accentColor={accentColor}
          todos={todos}
        />
      )}
      {schedule.drip && schedule.dripItems?.length > 0 && (
        <ItemList
          title="Drip Items"
          items={schedule.dripItems}
          textColor={textColor}
          accentColor={accentColor}
          todos={todos}
        />
      )}
    </View>
  );
};

const ItemList = ({ title, items, textColor, accentColor, todos }) => {
  const getStock = (name) =>
    todos.find((t) => t.name.toLowerCase() === name.toLowerCase());

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ fontWeight: "600", color: accentColor, marginBottom: 6 }}>
        {title}:
      </Text>
      <View
        style={{
          flexDirection: "row",
          paddingVertical: 4,
          borderBottomWidth: 1,
          borderBottomColor: "#888",
        }}
      >
        <Text style={[styles.tableHeader, { color: textColor }]}>Name</Text>
        <Text style={[styles.tableHeader, { color: textColor }]}>Required</Text>
        <Text style={[styles.tableHeader, { color: textColor }]}>
          Available
        </Text>
      </View>
      {items.map((item, i) => {
        const stock = getStock(item.name);
        const availableQty = stock?.remaining.remaining ?? 0;
        const unit = stock?.remaining?.unit || "";
        const isAvailable =
          stock && availableQty >= parseFloat(item.finalQty ?? 0);

        return (
          <View
            key={i}
            style={{
              flexDirection: "row",
              paddingVertical: 4,
              borderBottomWidth: 0.5,
              borderBottomColor: "#ccc",
            }}
          >
            <Text style={[styles.tableCell, { color: textColor }]}>
              {item.name}
            </Text>
            <Text style={[styles.tableCell, { color: accentColor }]}>
              {item.finalQty ? `${item.finalQty} ${item.finalUnit}` : "—"}
            </Text>
            <Text
              style={[
                styles.tableCell,
                { color: isAvailable ? "green" : "red" },
              ]}
            >
              {isAvailable
                ? `✅ ${availableQty} ${unit}`
                : `❌ ${availableQty} ${unit}`}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = {
  tableHeader: { flex: 1, fontWeight: "600", fontSize: 13 },
  tableCell: { flex: 1, fontSize: 13 },
};
