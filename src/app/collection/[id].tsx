import { useMemo, useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, Trash2, Pen } from "lucide-react-native";

import { Container } from "@/components/container";
import { Text, TextInput } from "@/components/text";
import Titre from "@/components/titre";
import { BottomSheet } from "@/components/bottom-sheet";
import theme from "@/constantes/constant-style";
import { useDatabase } from "@/contexts/database-context";
import type { Produit } from "@/Database/produits";
import { formatMontant } from "@/utils/format";

export default function CollectionDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const { collections, produits: tousLesProduits, creerProduit, modifierProduit, supprimerProduit } = useDatabase();

    const collection = useMemo(() => collections.find((c) => c.id === Number(id)) ?? null, [collections, id]);
    const produits = useMemo(
        () => tousLesProduits.filter((p) => p.collections_id === Number(id)),
        [tousLesProduits, id]
    );

    const [modalProduitVisible, setModalProduitVisible] = useState(false);
    const [nomProduit, setNomProduit] = useState("");
    const [prixProduit, setPrixProduit] = useState("");
    const [produitEnEdition, setProduitEnEdition] = useState<Produit | null>(null);

    const [modalActionVisible, setModalActionVisible] = useState(false);
    const [produitSelectionne, setProduitSelectionne] = useState<Produit | null>(null);

    function fermerModalProduit() {
        setModalProduitVisible(false);
    }

    function fermerModalAction() {
        setModalActionVisible(false);
    }

    function ouvrirModalAjout() {
        setProduitEnEdition(null);
        setNomProduit("");
        setPrixProduit("");
        setModalProduitVisible(true);
    }

    function ouvrirModalAction(produit: Produit) {
        setProduitSelectionne(produit);
        setModalActionVisible(true);
    }

    function handleChoisirModifier() {
        if (!produitSelectionne) return;
        setProduitEnEdition(produitSelectionne);
        setNomProduit(produitSelectionne.name);
        setPrixProduit(String(produitSelectionne.prix));
        fermerModalAction();
        setModalProduitVisible(true);
    }

    function handleChoisirSupprimer() {
        if (!produitSelectionne) return;
        const produit = produitSelectionne;
        Alert.alert(
            "Supprimer le produit",
            `Voulez-vous vraiment supprimer "${produit.name}" ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        await supprimerProduit(produit.id);
                        fermerModalAction();
                    },
                },
            ]
        );
    }

    async function handleEnregistrerProduit() {
        const prix = Number(prixProduit.replace(",", "."));
        if (!nomProduit.trim() || !prix) return;

        if (produitEnEdition) {
            await modifierProduit(produitEnEdition.id, { name: nomProduit.trim(), prix });
        } else {
            await creerProduit({ collections_id: Number(id), name: nomProduit.trim(), prix });
        }

        setNomProduit("");
        setPrixProduit("");
        setProduitEnEdition(null);
        fermerModalProduit();
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
            <Stack.Screen options={{
                headerTitle: collection?.name ?? "Collection",
                headerShown: true,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: "#f5f5f5" },
            }} />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom }}>
                <Titre titre="Produits" />
                <Container style={{ gap: 8 }}>
                    <View style={{ gap: 3, overflow: 'hidden', borderRadius: theme.internal_radius, borderColor: 'transparent', borderWidth: 1 }}>
                        <TouchableOpacity style={styles.button} onPress={ouvrirModalAjout}>
                            <Text style={{ fontSize: theme.size_two }}>Ajouter un produit</Text>
                            <Plus color="black" size={20} strokeWidth={1} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ gap: 3, overflow: 'hidden', borderRadius: theme.internal_radius, borderColor: 'transparent', borderWidth: 1 }}>
                        {produits.map((produit) => (
                            <TouchableOpacity key={produit.id} style={styles.button} onPress={() => ouvrirModalAction(produit)}>
                                <Text style={{ fontSize: theme.size_two }}>{produit.name}</Text>
                                <Text style={{ fontSize: theme.size_two, color: "#777" }}>{formatMontant(produit.prix)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Container>
            </ScrollView>

            <BottomSheet visible={modalProduitVisible} onClose={fermerModalProduit}>
                <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.internal_padding_2 }}>
                    <Text style={{ fontSize: theme.size_three, fontWeight: "bold" }}>{produitEnEdition ? "Modifier le produit" : "Nouveau produit"}</Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: theme.internal_padding, paddingBottom: theme.internal_padding }}>
                    <TextInput
                        autoFocus
                        value={nomProduit}
                        onChangeText={setNomProduit}
                        placeholder="Nom du produit"
                        placeholderTextColor={"#aaaaaa"}
                        returnKeyType="next"
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
                        value={prixProduit}
                        onChangeText={setPrixProduit}
                        placeholder="Prix"
                        placeholderTextColor={"#aaaaaa"}
                        keyboardType="numeric"
                        onSubmitEditing={handleEnregistrerProduit}
                        returnKeyType="done"
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
                        onPress={handleEnregistrerProduit}
                        style={{ width: 40, aspectRatio: 1, borderRadius: 20, backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}
                    >
                        <Plus color="white" size={18} />
                    </TouchableOpacity>
                </View>
            </BottomSheet>

            <BottomSheet
                visible={modalActionVisible}
                onClose={fermerModalAction}
                keyboardAvoiding={false}
                sheetStyle={{ paddingBottom: insets.bottom + theme.internal_padding }}
            >
                <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.internal_padding_2, paddingBottom: theme.internal_padding }}>
                    <Text style={{ fontSize: theme.size_three, fontWeight: "bold" }}>{produitSelectionne?.name}</Text>
                </View>

                <View style={{ paddingHorizontal: theme.internal_padding, gap: 3 }}>
                    <TouchableOpacity style={{ flexDirection: "row", paddingHorizontal: theme.internal_padding, gap: 14, alignItems: "center", paddingVertical: theme.internal_padding_2 }} onPress={handleChoisirModifier}>
                        <Pen color="#000000" size={18} strokeWidth={1.5} /><Text style={{ fontSize: theme.size_two }}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flexDirection: "row", paddingHorizontal: theme.internal_padding, gap: 14, alignItems: "center", paddingVertical: theme.internal_padding_2 }} onPress={handleChoisirSupprimer}>
                        <Trash2 color="#e74c3c" size={18} strokeWidth={1.5} />
                        <Text style={{ fontSize: theme.size_two, color: "#e74c3c" }}>Supprimer</Text>
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
