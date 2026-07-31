import { useMemo, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";

import { Container } from "@/components/container";
import { Text, TextInput } from "@/components/text";
import theme from "@/constantes/constant-style";
import { useDatabase } from "@/contexts/database-context";
import { formatMontant } from "@/utils/format";

export default function Utilisateurs() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { users, mouvements } = useDatabase();
    const [recherche, setRecherche] = useState("");

    const clients = useMemo(() => {
        return users
            .map((user) => {
                const solde = mouvements.filter((m) => m.client_id === user.id).reduce((total, m) => total + m.montant * m.sens, 0);
                return { id: user.id, nom: user.nom, solde };
            })
            .filter((client) => client.nom.toLowerCase().includes(recherche.trim().toLowerCase()))
            .sort((a, b) => b.solde - a.solde);
    }, [users, mouvements, recherche]);

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
            <Stack.Screen options={{
                headerTitle: "Clients",
                headerShown: true,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: "#f5f5f5" },
            }} />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom }}>
                <Container style={{ marginTop: theme.internal_padding, gap: 8 }}>
                    {users.length > 3 && (
                        <TextInput
                            value={recherche}
                            onChangeText={setRecherche}
                            placeholder="Rechercher un client"
                            placeholderTextColor={"#aaaaaa"}
                            style={{
                                fontSize: theme.size_two,
                                backgroundColor: "#fff",
                                borderRadius: theme.internal_radius_2,
                                paddingHorizontal: theme.internal_padding,
                                paddingVertical: theme.internal_padding_2,
                            }}
                        />
                    )}
                    <View style={{ gap: 3, overflow: 'hidden', borderRadius: theme.internal_radius, borderColor: 'transparent', borderWidth: 1 }}>
                        {clients.length === 0 ? (
                            <View style={{ padding: theme.internal_padding, backgroundColor: "white", borderRadius: theme.internal_radius, alignItems: "center" }}>
                                <Text style={{ color: "#777" }}>Aucun client pour l'instant.</Text>
                            </View>
                        ) : (
                            clients.map((client) => (
                                <TouchableOpacity
                                    key={client.id}
                                    style={styles.button}
                                    onPress={() => router.push(`/commandes/${client.id}` as any)}
                                >
                                    <Text style={{ fontSize: theme.size_two }}>{client.nom}</Text>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                        <Text style={{ fontSize: theme.size_two, color: client.solde > 0 ? "#e74c3c" : "#000" }}>
                                            {formatMontant(client.solde)}
                                        </Text>
                                        <ChevronRight color="black" size={20} strokeWidth={1} />
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </Container>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: 'white',
        padding: theme.internal_padding,
        borderRadius: theme.internal_radius_2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
});
