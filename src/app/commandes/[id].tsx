import { useMemo, useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, Trash2 } from "lucide-react-native";

import { Container } from "@/components/container";
import { Text, TextInput } from "@/components/text";
import Titre from "@/components/titre";
import { BottomSheet } from "@/components/bottom-sheet";
import theme from "@/constantes/constant-style";
import { useDatabase } from "@/contexts/database-context";
import { formatMontant } from "@/utils/format";

function formatDate(dateOp: string) {
    const date = new Date(dateOp);
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatLibelle(libelle: string | null) {
    if (!libelle) return "";
    try {
        const parsed = JSON.parse(libelle);
        if (Array.isArray(parsed)) {
            return parsed.map((item) => `${item.qte} ${item.nom}`).join(" + ");
        }
        return String(parsed);
    } catch {
        return libelle;
    }
}

export default function CommandeClientDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const { users, mouvements: tousLesMouvements, creerMouvement, supprimerMouvement } = useDatabase();

    const client = useMemo(() => users.find((u) => u.id === Number(id)) ?? null, [users, id]);
    const mouvements = useMemo(
        () => tousLesMouvements
            .filter((m) => m.client_id === Number(id))
            .sort((a, b) => new Date(b.date_op).getTime() - new Date(a.date_op).getTime()),
        [tousLesMouvements, id]
    );
    const solde = useMemo(() => mouvements.reduce((total, m) => total + m.montant * m.sens, 0), [mouvements]);

    const [modalVisible, setModalVisible] = useState(false);
    const [montant, setMontant] = useState("");
    const [libelle, setLibelle] = useState("");

    function fermerModal() {
        setModalVisible(false);
    }

    function ouvrirModalAjout() {
        setMontant("");
        setLibelle("");
        setModalVisible(true);
    }

    function handleSupprimerMouvement(mouvementId: number) {
        Alert.alert(
            "Supprimer ce mouvement",
            "Cette action est irréversible. Confirmer la suppression ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await supprimerMouvement(mouvementId);
                        } catch (error) {
                            Alert.alert("Impossible de supprimer", error instanceof Error ? error.message : "Une erreur est survenue.");
                        }
                    },
                },
            ]
        );
    }

    async function handleEnregistrerMouvement() {
        const montantNombre = Number(montant.replace(",", "."));
        if (!montantNombre) return;

        try {
            await creerMouvement({
                client_id: Number(id),
                type: "paiement",
                montant: montantNombre,
                sens: -1,
                libelle: libelle.trim() ? JSON.stringify(libelle.trim()) : null,
                date_op: new Date().toISOString(),
            });
        } catch (error) {
            Alert.alert("Impossible d'enregistrer", error instanceof Error ? error.message : "Une erreur est survenue.");
            return;
        }

        setMontant("");
        setLibelle("");
        fermerModal();
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
            <Stack.Screen options={{
                headerTitle: client?.nom ?? "Client",
                headerShown: true,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: "#f5f5f5" },
            }} />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom }}>
                <Container style={{ marginTop: theme.internal_padding }}>
                    <View style={{ backgroundColor: "white", borderRadius: theme.internal_radius, padding: theme.internal_padding }}>
                        <Text style={{ fontSize: theme.size_one, color: "#777" }}>Solde</Text>
                        <Text style={{ fontSize: theme.size_five, fontWeight: "bold", color: solde > 0 ? "#e74c3c" : "#000" }}>
                            {formatMontant(solde)}
                        </Text>
                    </View>
                </Container>

                <Titre titre="Historique" />
                <Container style={{ gap: 8 }}>
                    <View style={{ gap: 3, overflow: 'hidden', borderRadius: theme.internal_radius, borderColor: 'transparent', borderWidth: 1 }}>
                        <TouchableOpacity style={styles.button} onPress={ouvrirModalAjout}>
                            <Text style={{ fontSize: theme.size_two }}>Enregistrer un paiement</Text>
                            <Plus color="black" size={20} strokeWidth={1} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ gap: 3, overflow: 'hidden', borderRadius: theme.internal_radius, borderColor: 'transparent', borderWidth: 1 }}>
                        {mouvements.map((mouvement) => (
                            <View key={mouvement.id} style={styles.button}>
                                <View>
                                    <Text style={{ fontSize: theme.size_two }}>
                                        {mouvement.type === "dette" ? "Dette" : mouvement.type === "paiement" ? "Paiement" : "Correction"}
                                    </Text>
                                    {!!mouvement.libelle && (
                                        <Text style={{ fontSize: theme.size_one, color: "#777" }}>{formatLibelle(mouvement.libelle)}</Text>
                                    )}
                                    <Text style={{ fontSize: theme.size_one, color: "#aaa" }}>{formatDate(mouvement.date_op)}</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                    <Text style={{ fontSize: theme.size_two, color: mouvement.sens > 0 ? "#e74c3c" : "#2ecc71" }}>
                                        {mouvement.sens > 0 ? "+" : "-"}{formatMontant(mouvement.montant)}
                                    </Text>
                                    <TouchableOpacity onPress={() => handleSupprimerMouvement(mouvement.id)} hitSlop={8}>
                                        <Trash2 color="#e74c3c" size={16} strokeWidth={1.5} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                </Container>
            </ScrollView>

            <BottomSheet visible={modalVisible} onClose={fermerModal}>
                <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.internal_padding_2 }}>
                    <Text style={{ fontSize: theme.size_three, fontWeight: "bold" }}>Nouveau paiement</Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: theme.internal_padding, paddingTop: theme.internal_padding, paddingBottom: theme.internal_padding }}>

                    <TextInput
                        value={montant}
                        onChangeText={setMontant}
                        placeholder="Montant"
                        placeholderTextColor={"#aaaaaa"}
                        keyboardType="numeric"
                        onSubmitEditing={handleEnregistrerMouvement}
                        returnKeyType="done"
                        style={{
                            flex: 1,
                            fontSize: theme.size_two,
                            backgroundColor: "#fff",
                            borderRadius: theme.internal_radius_2,
                            paddingHorizontal: theme.internal_padding,
                            paddingVertical: theme.internal_padding_2,
                        }}
                    />
                    <TextInput
                        value={libelle}
                        onChangeText={setLibelle}
                        placeholder="Libellé (optionnel)"
                        placeholderTextColor={"#aaaaaa"}
                        returnKeyType="next"
                        style={{
                            width: 90,
                            fontSize: theme.size_two,
                            backgroundColor: "#fff",
                            borderRadius: theme.internal_radius_2,
                            paddingHorizontal: theme.internal_padding,
                            paddingVertical: theme.internal_padding_2,
                        }}
                    />
                    <TouchableOpacity
                        onPress={handleEnregistrerMouvement}
                        style={{ width: 40, aspectRatio: 1, borderRadius: 20, backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}
                    >
                        <Plus color="white" size={18} />
                    </TouchableOpacity>
                </View>
            </BottomSheet>
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
