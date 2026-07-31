import { useMemo } from "react";
import { View, StatusBar, Image, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter } from "expo-router";

import { Container } from "@/components/container";
import Titre from "@/components/titre";
import { OpenSessionsHistory } from "@/components/open-sessions-history";
import { RecetteDetteTrendChart } from "@/components/recette-dette-trend-chart";
import { CurrentOrderCard } from "@/components/current-order-card";
import { Plus, Settings2 } from "lucide-react-native"
import { Text } from "@/components/text";
import theme from "@/constantes/constant-style"
import { useDatabase } from "@/contexts/database-context";
import { formatMontant } from "@/utils/format";

export default function Index() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { users, mouvements } = useDatabase();

  const totalNonCouverte = useMemo(() => {
    return users.reduce((total, user) => {
      const solde = mouvements.filter((m) => m.client_id === user.id).reduce((somme, m) => somme + m.montant * m.sens, 0);
      return total + Math.max(solde, 0);
    }, 0);
  }, [users, mouvements]);

  const totalAttendu = useMemo(() => {
    return mouvements.filter((m) => m.type === "dette").reduce((total, m) => total + m.montant, 0);
  }, [mouvements]);

  const tendance = useMemo(() => {
    const parJour = new Map<string, { recette: number; dette: number }>();
    mouvements.forEach((m) => {
      const jour = m.date_op.slice(0, 10);
      const entree = parJour.get(jour) ?? { recette: 0, dette: 0 };
      if (m.type === "dette") entree.dette += m.montant;
      else if (m.type === "paiement") entree.recette += m.montant;
      parJour.set(jour, entree);
    });

    const septDerniersJours: string[] = [];
    const aujourdhui = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(aujourdhui);
      date.setDate(date.getDate() - i);
      septDerniersJours.push(date.toISOString().slice(0, 10));
    }

    return septDerniersJours.map((jour) => {
      const { recette, dette } = parJour.get(jour) ?? { recette: 0, dette: 0 };
      return {
        jour,
        label: new Date(jour).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        recette,
        dette,
      };
    });
  }, [mouvements]);

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: "#f5f5f5", flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom * 4 }}>
        <View style={{ height: 120, justifyContent: "center" }}>
          <Container style={{ marginTop: 32, flexDirection: "row", alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ height: 24, width: 120 }}>
              <Image source={require("@/assets/images/splash-icon.png")} style={{ resizeMode: 'contain', width: '100%', height: '100%' }} />
            </View>

            <TouchableOpacity
              onPress={() => router.push("/preference")}
              style={{ width: 42, aspectRatio: 1, borderRadius: 24, alignItems: "center", justifyContent: 'center', backgroundColor: 'white' }}
            >
              <Settings2 size={18} color="#000" />
            </TouchableOpacity>
          </Container>
        </View>
        <View>
          <Container style={{ height: 250, alignItems: 'center', justifyContent: "center" }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: theme.size_two, marginBottom: -5 }}>Total somme non couverte</Text>
              <Text style={{ fontSize: 48, fontWeight: "bold" }}>{formatMontant(totalNonCouverte)}</Text>
              <View style={{ alignItems: 'center', paddingHorizontal: theme.internal_padding * 1.5, paddingVertical: 3, backgroundColor: "#AEF2E0", borderRadius: theme.internal_radius_2 }}>
                <Text style={{ fontSize: theme.size_two, }}>Total attendu</Text>
                <Text style={{ fontSize: theme.size_three, fontWeight: "bold" }}>{formatMontant(totalAttendu)}</Text>
              </View>
            </View>
          </Container>
          <Container>
            <RecetteDetteTrendChart data={tendance} />
          </Container>
        </View>
        <Titre titre="Session" />
        <Container>
          <CurrentOrderCard />
        </Container>

        <Titre titre="Historique" />
        <Container>
          <OpenSessionsHistory />
        </Container>
      </ScrollView>

    </View>
  );
}
