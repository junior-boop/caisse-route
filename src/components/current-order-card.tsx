import { TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ClipboardList, Plus, Users } from "lucide-react-native";

import { Text } from "@/components/text";
import { PulsingDot } from "@/components/pulsing-dot";
import theme from "@/constantes/constant-style";
import { useDatabase } from "@/contexts/database-context";

export function CurrentOrderCard() {
  const router = useRouter();
  const { sessionDuJour, mouvements, creerNouvelleSession } = useDatabase();
  const sessionOuverte = !!sessionDuJour && sessionDuJour.fermee === 0;

  const mouvementsSession = sessionOuverte ? mouvements.filter((m) => m.session_id === sessionDuJour!.id) : [];
  const commandeCount = mouvementsSession.filter((m) => m.type === "dette").length;
  const clientsSession = Array.from(new Set(mouvementsSession.filter((m) => m.type === "dette").map((m) => m.client_id)));
  const couverteCount = clientsSession.filter((clientId) => {
    const solde = mouvements.filter((m) => m.client_id === clientId).reduce((total, m) => total + m.montant * m.sens, 0);
    return solde <= 0;
  }).length;
  const pourcentage = clientsSession.length > 0 ? Math.min(100, Math.round((couverteCount / clientsSession.length) * 100)) : 0;

  async function handleNouvelleSession() {
    await creerNouvelleSession();
    router.push("/commandes" as any);
  }

  if (!sessionOuverte) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleNouvelleSession}
        style={{ backgroundColor: "rgb(129, 240, 229)", padding: theme.internal_padding, borderRadius: theme.internal_radius, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontWeight: "bold", fontSize: theme.size_three, color: "#000000ce" }}>Nouvelle session</Text>
        <Plus size={20} color="#000000ce" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push("/commandes" as any)}
      style={{ backgroundColor: "rgb(129, 240, 229)", padding: theme.internal_padding, borderRadius: theme.internal_radius, gap: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <PulsingDot size={10} color="#000" />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "bold", fontSize: theme.size_three, color: "#000000ce", marginBottom: 8 }}>Commande de la journée</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <ClipboardList size={14} color="#00000099" />
                <Text style={{ fontSize: theme.size_one, color: "#00000099" }}>Commandes</Text>
              </View>
              <Text style={{ fontSize: theme.size_four, fontWeight: "bold", color: "#000000ce" }}>{commandeCount}</Text>
            </View>

            <View style={{ width: 1, height: 34, backgroundColor: "#00000022" }} />

            <View style={{ flex: 1, gap: 4, paddingLeft: theme.internal_padding }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Users size={14} color="#00000099" />
                <Text style={{ fontSize: theme.size_one, color: "#00000099" }}>Couvertes</Text>
              </View>
              <Text style={{ fontSize: theme.size_four, fontWeight: "bold", color: "#000000ce" }}>{couverteCount}</Text>
            </View>
          </View>

          <View style={{ gap: 4 }}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: "#ffffff80", overflow: "hidden" }}>
              <View style={{ width: `${pourcentage}%`, height: "100%", borderRadius: 3, backgroundColor: "#000000ce" }} />
            </View>
            <Text style={{ fontSize: theme.size_one - 2, color: "#00000099" }}>{pourcentage}% des clients couverts</Text>
          </View>
        </View>
      </View>


    </TouchableOpacity>
  );
}
