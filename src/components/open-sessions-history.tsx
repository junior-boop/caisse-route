import { useMemo } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { Text } from "@/components/text";
import theme from "@/constantes/constant-style";
import { useDatabase } from "@/contexts/database-context";
import { formatMontant } from "@/utils/format";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function OpenSessionsHistory() {
  const router = useRouter();
  const { sessions, mouvements } = useDatabase();

  const sessionsFermees = useMemo(() => {
    return sessions
      .filter((session) => session.fermee === 1)
      .map((session) => {
        const clientsSession = Array.from(new Set(
          mouvements.filter((m) => m.session_id === session.id && m.type === "dette").map((m) => m.client_id)
        ));
        const soldesClients = clientsSession.map((clientId) =>
          mouvements.filter((m) => m.client_id === clientId).reduce((total, m) => total + m.montant * m.sens, 0)
        );
        const remainingDebt = soldesClients.reduce((total, solde) => total + Math.max(solde, 0), 0);
        const uncoveredCount = soldesClients.filter((solde) => solde > 0).length;
        return { id: session.id, date: formatDate(session.date), remainingDebt, uncoveredCount };
      });
  }, [sessions, mouvements]);

  if (sessionsFermees.length === 0) {
    return (
      <View style={{ paddingVertical: theme.internal_padding, height: 150, alignItems: 'center', justifyContent: "center", paddingHorizontal: theme.internal_padding, backgroundColor: 'white', borderRadius: theme.internal_radius }}>
        <Text style={{ color: "#777" }}>Aucune session fermée pour l’instant.</Text>
      </View>
    );
  }

  return (
    <View style={{ borderRadius: theme.internal_radius, overflow: "hidden", gap: 4 }}>
      {sessionsFermees.map((session, index) => (
        <TouchableOpacity
          key={session.id}
          activeOpacity={0.6}
          onPress={() => router.push(`/session/${session.id}` as any)}
          style={[styles.item, index === 0 ? { paddingTop: theme.internal_padding, borderRadius: theme.internal_radius_2 } : { paddingTop: theme.internal_padding_2, borderRadius: theme.internal_radius_2 }]}
        >
          <Text>Session : {session.date}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Dette restante</Text>
              <Text style={styles.summaryValue}>{formatMontant(session.remainingDebt)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Non couverte</Text>
              <Text style={[styles.summaryValue, { color: "#D64545" }]}>{session.uncoveredCount} pers.</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    paddingHorizontal: theme.internal_padding,
    backgroundColor: "white",
    gap: 5,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: theme.internal_padding,
    backgroundColor: "#ffffff",
  },
  summaryItem: {
    flex: 1,
    gap: 4,
  },
  summaryLabel: {
    fontSize: theme.size_one,
    color: "#838383",
  },
  summaryValue: {
    fontSize: theme.size_three,
    fontWeight: "bold",
    color: "#000000ce",
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: "#E5E5E5",
    marginHorizontal: theme.internal_padding,
  },
});
