import { useMemo } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { Text } from "@/components/text";
import Titre from "@/components/titre";
import theme from "@/constantes/constant-style";
import { useDatabase } from "@/contexts/database-context";
import { formatMontant } from "@/utils/format";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function SessionDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessions, mouvements, users } = useDatabase();

  const session = useMemo(() => sessions.find((s) => s.id === Number(id)) ?? null, [sessions, id]);

  const mouvementsSession = useMemo(
    () => mouvements.filter((m) => m.session_id === Number(id)),
    [mouvements, id]
  );

  const clientsSession = useMemo(() => {
    const clientIds = Array.from(new Set(mouvementsSession.filter((m) => m.type === "dette").map((m) => m.client_id)));
    return clientIds
      .map((clientId) => {
        const montantSession = mouvementsSession
          .filter((m) => m.client_id === clientId && m.type === "dette")
          .reduce((total, m) => total + m.montant, 0);
        const soldeActuel = mouvements
          .filter((m) => m.client_id === clientId)
          .reduce((total, m) => total + m.montant * m.sens, 0);
        return { id: clientId, nom: users.find((u) => u.id === clientId)?.nom ?? "Client", montantSession, soldeActuel };
      })
      .sort((a, b) => b.soldeActuel - a.soldeActuel);
  }, [mouvementsSession, mouvements, users]);

  const totalCommandes = mouvementsSession.filter((m) => m.type === "dette").length;
  const montantSession = session?.fermee === 1
    ? session.montant_total ?? 0
    : mouvementsSession.reduce((total, m) => total + m.montant * m.sens, 0);

  if (!session) {
    return (
      <View style={{ paddingTop: insets.top, backgroundColor: "#f5f5f5", flex: 1 }}>
        <Container style={{ marginTop: theme.internal_padding }}>
          <Text>Session introuvable.</Text>
        </Container>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5", }}>
      <Stack.Screen options={{
        headerTitle: formatDate(session.date),
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#f5f5f5" },
      }} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom }}>
        <Container style={{ marginTop: theme.internal_padding }}>
          <View style={{ backgroundColor: "white", borderRadius: theme.internal_radius, padding: theme.internal_padding, flexDirection: "row" }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: theme.size_one, color: "#777" }}>Commandes</Text>
              <Text style={{ fontSize: theme.size_four, fontWeight: "bold" }}>{totalCommandes}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: "#00000011" }} />
            <View style={{ flex: 1, gap: 4, paddingLeft: theme.internal_padding }}>
              <Text style={{ fontSize: theme.size_one, color: "#777" }}>Montant total</Text>
              <Text style={{ fontSize: theme.size_four, fontWeight: "bold" }}>{formatMontant(montantSession)}</Text>
            </View>
          </View>
        </Container>

        <Titre titre="Clients" />
        <Container style={{ gap: 3 }}>
          {clientsSession.length === 0 ? (
            <View style={{ padding: theme.internal_padding, backgroundColor: "white", borderRadius: theme.internal_radius, alignItems: "center" }}>
              <Text style={{ color: "#777" }}>Aucun client dans cette session.</Text>
            </View>
          ) : (
            clientsSession.map((client) => (
              <TouchableOpacity key={client.id} style={styles.button} onPress={() => router.push(`/commandes/${client.id}` as any)}>
                <View>
                  <Text style={{ fontSize: theme.size_two }}>{client.nom}</Text>
                  <Text style={{ fontSize: theme.size_one, color: "#777" }}>{formatMontant(client.montantSession)} commandé</Text>
                </View>
                <Text style={{ fontSize: theme.size_two, color: client.soldeActuel > 0 ? "#e74c3c" : "#2ecc71" }}>
                  {client.soldeActuel > 0 ? "Non couvert" : "Couvert"}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </Container>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "white",
    padding: theme.internal_padding,
    borderRadius: theme.internal_radius_2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
