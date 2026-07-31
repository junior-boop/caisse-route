import { useMemo, useState } from "react";
import { Container } from "@/components/container";
import { Text, TextInput } from "@/components/text";
import { Stack, useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Updates from "expo-updates";
import theme from "@/constantes/constant-style"
import { ChevronRight, Plus } from "lucide-react-native";
import Titre from "@/components/titre";
import { BottomSheet } from "@/components/bottom-sheet";
import { useDatabase } from "@/contexts/database-context";
import { formatMontant } from "@/utils/format";

async function handleVerifierMiseAJour() {
    if (!Updates.isEnabled) {
        Alert.alert("Mises à jour", "Les mises à jour ne sont pas disponibles dans ce mode (développement).");
        return;
    }
    try {
        const resultat = await Updates.checkForUpdateAsync();
        if (!resultat.isAvailable) {
            Alert.alert("Mises à jour", "L'application est déjà à jour.");
            return;
        }
        await Updates.fetchUpdateAsync();
        Alert.alert(
            "Mise à jour disponible",
            "Une nouvelle version a été téléchargée. Redémarrer l'application maintenant ?",
            [
                { text: "Plus tard", style: "cancel" },
                { text: "Redémarrer", onPress: () => Updates.reloadAsync() },
            ]
        );
    } catch (error) {
        Alert.alert("Impossible de vérifier les mises à jour", error instanceof Error ? error.message : "Une erreur est survenue.");
    }
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function Preference() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { collections, creerCollection, users, mouvements } = useDatabase();

    const plusGrosDebiteur = useMemo(() => {
        const clients = users.map((user) => {
            const mouvementsClient = mouvements.filter((m) => m.client_id === user.id);
            const solde = mouvementsClient.reduce((total, m) => total + m.montant * m.sens, 0);
            const derniereDette = mouvementsClient
                .filter((m) => m.type === "dette")
                .sort((a, b) => new Date(b.date_op).getTime() - new Date(a.date_op).getTime())[0];
            return { nom: user.nom, solde, date: derniereDette?.date_op ?? null };
        });
        return clients.filter((c) => c.solde > 0).sort((a, b) => b.solde - a.solde)[0] ?? null;
    }, [users, mouvements]);

    const [modalCollectionVisible, setModalCollectionVisible] = useState(false);
    const [nomCollection, setNomCollection] = useState("");

    function fermerModalCollection() {
        setModalCollectionVisible(false);
    }

    async function handleAjouterCollection() {
        if (!nomCollection.trim()) return;
        await creerCollection({ name: nomCollection.trim() });
        setNomCollection("");
        fermerModalCollection();
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
            <Stack.Screen options={{
                headerTitle: "Préférences",
                headerShown: true,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: "#f5f5f5" }
            }} />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom }}>


                <Titre titre="Clients" />
                <Container>
                    <View style={{ gap: 3, overflow: 'hidden', borderRadius: theme.internal_radius, borderColor: 'transparent', borderWidth: 1 }}>
                        <TouchableOpacity style={styles.button} onPress={() => router.push("/utilisateurs" as any)}>
                            <Text style={{ fontSize: theme.size_two }}>Liste des clients</Text>
                            <ChevronRight color="black" size={20} strokeWidth={1} />
                        </TouchableOpacity>
                        <View style={styles.button}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: theme.size_one, color: "#777" }}>Client avec le plus fort impayé</Text>
                                {plusGrosDebiteur ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: "space-between", flex: 1 }}>
                                        <View>
                                            <Text>{plusGrosDebiteur.nom}</Text>
                                            <Text>{formatMontant(plusGrosDebiteur.solde)}</Text>
                                        </View>
                                        {plusGrosDebiteur.date && <Text style={{ color: "#777" }}>{formatDate(plusGrosDebiteur.date)}</Text>}
                                    </View>
                                ) : (
                                    <Text style={{ color: "#777" }}>Aucun impayé pour l'instant.</Text>
                                )}
                            </View>
                        </View>
                    </View>
                </Container>

                <Titre titre="Collection" />
                <Container style={{ gap: 8 }}>
                    <View style={{ gap: 3, overflow: 'hidden', borderRadius: theme.internal_radius, borderColor: 'transparent', borderWidth: 1 }}>
                        <TouchableOpacity style={styles.button} onPress={() => setModalCollectionVisible(true)}>
                            <Text style={{ fontSize: theme.size_two }}>Ajouter une collection</Text>
                            <Plus color="black" size={20} strokeWidth={1} />
                        </TouchableOpacity>
                    </View>
                    {collections.length > 0 && (
                        <View style={{ gap: 3, overflow: 'hidden', borderRadius: theme.internal_radius, borderColor: 'transparent', borderWidth: 1 }}>
                            {collections.map((collection) => (
                                <TouchableOpacity
                                    key={collection.id}
                                    style={styles.button}
                                    onPress={() => router.push(`/collection/${collection.id}` as any)}
                                >
                                    <View>
                                        <Text style={{ fontSize: theme.size_two }}>{collection.name}</Text>
                                        <Text style={{ fontSize: theme.size_one, color: "#777" }}>{collection.produits.length} produit{collection.produits.length > 1 ? "s" : ""}</Text>
                                    </View>
                                    <ChevronRight color="black" size={20} strokeWidth={1} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </Container>

                <Titre titre="Mises à jour" />
                <Container>
                    <View style={{ gap: 3, overflow: 'hidden', borderRadius: theme.internal_radius, borderColor: 'transparent', borderWidth: 1 }}>
                        <TouchableOpacity style={styles.button} onPress={handleVerifierMiseAJour}>
                            <Text style={{ fontSize: theme.size_two }}>Vérifier les mises à jour</Text>
                            <ChevronRight color="black" size={20} strokeWidth={1} />
                        </TouchableOpacity>
                    </View>
                </Container>

            </ScrollView>

            <BottomSheet visible={modalCollectionVisible} onClose={fermerModalCollection}>
                <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.internal_padding_2 }}>
                    <Text style={{ fontSize: theme.size_three, fontWeight: "bold" }}>Nouvelle collection</Text>
                </View>

                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        paddingHorizontal: theme.internal_padding,
                        paddingBottom: theme.internal_padding,
                    }}
                >
                    <TextInput
                        autoFocus
                        value={nomCollection}
                        onChangeText={setNomCollection}
                        placeholder="Nom de la collection"
                        placeholderTextColor={"#aaaaaa"}
                        onSubmitEditing={handleAjouterCollection}
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
                    <TouchableOpacity
                        onPress={handleAjouterCollection}
                        style={{ width: 40, aspectRatio: 1, borderRadius: 20, backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}
                    >
                        <Plus color="white" size={18} />
                    </TouchableOpacity>
                </View>
            </BottomSheet>
        </View>
    )
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: 'white',
        padding: theme.internal_padding,
        borderRadius: theme.internal_radius_2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    }
})