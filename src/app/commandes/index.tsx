import { useMemo, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertTriangle, ChevronRight, ClipboardList, Lock, Minus, Plus, Wallet } from "lucide-react-native";

import { Container } from "@/components/container";
import { Text, TextInput } from "@/components/text";
import Titre from "@/components/titre";
import { BottomSheet } from "@/components/bottom-sheet";
import theme from "@/constantes/constant-style";
import { useDatabase } from "@/contexts/database-context";
import { formatMontant } from "@/utils/format";

export default function Commandes() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { users, produits, collections, mouvements, sessionDuJour, creerMouvement, creerUser, fermerSessionDuJour, creerNouvelleSession } = useDatabase();
    const sessionFermee = sessionDuJour?.fermee === 1;
    const sessionActive = !!sessionDuJour && sessionDuJour.fermee === 0;

    const clients = useMemo(() => {
        return users.map((user) => {
            const mouvementsClient = mouvements.filter((m) => m.client_id === user.id);
            const solde = mouvementsClient.reduce((total, m) => total + m.montant * m.sens, 0);
            const nombreCommandes = mouvementsClient.filter((m) => m.type === "dette").length;
            return { user, solde, nombreCommandes };
        });
    }, [users, mouvements]);

    const totalCommandes = useMemo(() => mouvements.filter((m) => m.type === "dette").length, [mouvements]);
    const totalDette = useMemo(() => clients.reduce((total, c) => total + Math.max(c.solde, 0), 0), [clients]);

    const clientsNonCouvertsPrecedents = useMemo(() => {
        return clients.filter(({ user, solde }) => {
            if (solde <= 0) return false;
            return mouvements.some(
                (m) => m.client_id === user.id && m.type === "dette" && m.session_id !== sessionDuJour?.id
            );
        }).length;
    }, [clients, mouvements, sessionDuJour]);

    const [rechercheClient, setRechercheClient] = useState("");
    const clientsAffiches = useMemo(() => {
        const recherche = rechercheClient.trim().toLowerCase();
        if (!recherche) return clients;
        return clients.filter(({ user }) => user.nom.toLowerCase().includes(recherche));
    }, [clients, rechercheClient]);

    const [modalVisible, setModalVisible] = useState(false);
    const [etape, setEtape] = useState<"client" | "produits">("client");
    const [nomClient, setNomClient] = useState("");
    const [clientSelectionneId, setClientSelectionneId] = useState<number | null>(null);
    const [quantites, setQuantites] = useState<Record<number, number>>({});

    function fermerModal() {
        setModalVisible(false);
    }

    const suggestions = useMemo(() => {
        const recherche = nomClient.trim().toLowerCase();
        if (!recherche) return [];
        return users.filter((u) => u.nom.toLowerCase().includes(recherche));
    }, [users, nomClient]);

    const total = useMemo(() => {
        return produits.reduce((somme, p) => somme + (quantites[p.id] ?? 0) * p.prix, 0);
    }, [produits, quantites]);

    function handleFermerSession() {
        Alert.alert(
            "Fermer la session",
            "Une fois fermée, plus aucune commande ne pourra être ajoutée pour aujourd'hui. Confirmer ?",
            [
                { text: "Annuler", style: "cancel" },
                { text: "Fermer", style: "destructive", onPress: () => fermerSessionDuJour() },
            ]
        );
    }

    function ouvrirModalCommande() {
        if (!sessionActive) return;
        setEtape("client");
        setNomClient("");
        setClientSelectionneId(null);
        setQuantites({});
        setModalVisible(true);
    }

    function choisirSuggestion(id: number, nom: string) {
        setClientSelectionneId(id);
        setNomClient(nom);
    }

    function changerQuantite(produitId: number, delta: number) {
        setQuantites((prev) => {
            const nouvelleQuantite = Math.max(0, (prev[produitId] ?? 0) + delta);
            return { ...prev, [produitId]: nouvelleQuantite };
        });
    }

    async function handleValiderCommande() {
        const nom = nomClient.trim();
        if (!nom) return;

        const items = produits
            .filter((p) => (quantites[p.id] ?? 0) > 0)
            .map((p) => ({ nom: p.name, qte: quantites[p.id], prix: p.prix }));
        if (items.length === 0) return;

        const montant = items.reduce((somme, item) => somme + item.prix * item.qte, 0);

        let clientId = clientSelectionneId;
        if (!clientId) {
            const existant = users.find((u) => u.nom.trim().toLowerCase() === nom.toLowerCase());
            if (existant) {
                clientId = existant.id;
            } else {
                const nouveauClient = await creerUser({ nom });
                clientId = nouveauClient.id;
            }
        }

        try {
            await creerMouvement({
                client_id: clientId,
                type: "dette",
                montant,
                sens: 1,
                libelle: JSON.stringify(items),
                date_op: new Date().toISOString(),
            });
            fermerModal();
        } catch {
            Alert.alert("Session fermée", "La session du jour est fermée, impossible d'ajouter une commande.");
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
            <Stack.Screen options={{
                headerTitle: "Commandes",
                headerShown: true,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: "#f5f5f5" },
            }} />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom }}>
                <Container style={{ marginTop: theme.internal_padding }}>
                    <View style={{ backgroundColor: "white", borderRadius: theme.internal_radius, padding: theme.internal_padding, flexDirection: "row" }}>
                        <View style={{ flex: 1, gap: 4 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <ClipboardList size={14} color="#00000099" />
                                <Text style={{ fontSize: theme.size_one, color: "#00000099" }}>Commandes</Text>
                            </View>
                            <Text style={{ fontSize: theme.size_four, fontWeight: "bold" }}>{totalCommandes}</Text>
                        </View>

                        <View style={{ width: 1, backgroundColor: "#00000011" }} />

                        <View style={{ flex: 1, gap: 4, paddingLeft: theme.internal_padding }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <Wallet size={14} color="#00000099" />
                                <Text style={{ fontSize: theme.size_one, color: "#00000099" }}>Dette totale</Text>
                            </View>
                            <Text style={{ fontSize: theme.size_four, fontWeight: "bold", color: totalDette > 0 ? "#e74c3c" : "#000" }}>
                                {formatMontant(totalDette)}
                            </Text>
                        </View>
                    </View>

                    {sessionActive && clientsNonCouvertsPrecedents > 0 && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: theme.internal_padding_2, paddingHorizontal: 4 }}>
                            <AlertTriangle size={14} color="#e67e22" />
                            <Text style={{ fontSize: theme.size_one, color: "#e67e22" }}>
                                {clientsNonCouvertsPrecedents} client{clientsNonCouvertsPrecedents > 1 ? "s" : ""} non couvert{clientsNonCouvertsPrecedents > 1 ? "s" : ""} des journées précédentes
                            </Text>
                        </View>
                    )}
                </Container>

                <Container style={{ marginTop: theme.internal_padding_2 }}>
                    <View style={[styles.button, { backgroundColor: sessionActive ? "white" : "#eee" }]}>
                        <View>
                            <Text style={{ fontSize: theme.size_two }}>
                                {!sessionDuJour ? "Aucune session en cours" : sessionFermee ? "Session fermée" : "Session ouverte"}
                            </Text>
                            {sessionDuJour && (
                                <Text style={{ fontSize: theme.size_one, color: "#777" }}>{sessionDuJour.date}</Text>
                            )}
                            {sessionFermee && (
                                <Text style={{ fontSize: theme.size_one, color: "#777" }}>
                                    {sessionDuJour?.total_commandes} commande{(sessionDuJour?.total_commandes ?? 0) > 1 ? "s" : ""} — {formatMontant(sessionDuJour?.montant_total ?? 0)}
                                </Text>
                            )}
                        </View>
                        {sessionFermee ? (
                            <Lock color="#777" size={20} strokeWidth={1} />
                        ) : sessionActive ? (
                            <TouchableOpacity onPress={handleFermerSession} style={{ backgroundColor: "#000", paddingHorizontal: theme.internal_padding, paddingVertical: theme.internal_padding_2, borderRadius: theme.internal_radius_2 }}>
                                <Text style={{ fontSize: theme.size_one, color: "#fff" }}>Fermer la session</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </Container>

                <Titre titre="Clients" />
                <Container style={{ gap: 8 }}>
                    <View style={{ gap: 3, overflow: 'hidden', borderRadius: theme.internal_radius, borderColor: 'transparent', borderWidth: 1 }}>
                        <TouchableOpacity style={styles.button} onPress={sessionActive ? ouvrirModalCommande : creerNouvelleSession}>
                            <Text style={{ fontSize: theme.size_two }}>{sessionActive ? "Nouvelle commande" : "Nouvelle session"}</Text>
                            <Plus color="black" size={20} strokeWidth={1} />
                        </TouchableOpacity>
                    </View>
                    {clients.length > 3 && (
                        <TextInput
                            value={rechercheClient}
                            onChangeText={setRechercheClient}
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
                        {clientsAffiches.map(({ user, solde, nombreCommandes }) => (
                            <TouchableOpacity
                                key={user.id}
                                style={styles.button}
                                onPress={() => router.push(`/commandes/${user.id}` as any)}
                            >
                                <View>
                                    <Text style={{ fontSize: theme.size_two }}>{user.nom}</Text>
                                    <Text style={{ fontSize: theme.size_one, color: "#777" }}>
                                        {nombreCommandes} commande{nombreCommandes > 1 ? "s" : ""}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <Text style={{ fontSize: theme.size_two, color: solde > 0 ? "#e74c3c" : "#000" }}>
                                        {formatMontant(solde)}
                                    </Text>
                                    <ChevronRight color="black" size={20} strokeWidth={1} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Container>
            </ScrollView>

            <BottomSheet visible={modalVisible} onClose={fermerModal} sheetStyle={{ maxHeight: "80%" }}>
                        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.internal_padding_2, paddingBottom: theme.internal_padding }}>
                            <Text style={{ fontSize: theme.size_three, fontWeight: "bold" }}>
                                {etape === "client" ? "Nouvelle commande" : "Sélection des produits"}
                            </Text>
                        </View>

                        {etape === "client" ? (
                            <View style={{ paddingHorizontal: theme.internal_padding, paddingBottom: theme.internal_padding, gap: 8 }}>
                                <TextInput
                                    autoFocus
                                    value={nomClient}
                                    onChangeText={(texte) => { setNomClient(texte); setClientSelectionneId(null); }}
                                    placeholder="Nom du client"
                                    placeholderTextColor={"#aaaaaa"}
                                    returnKeyType="next"
                                    style={{
                                        fontSize: theme.size_two,
                                        backgroundColor: "#f5f5f5",
                                        borderRadius: theme.internal_radius_2,
                                        paddingHorizontal: theme.internal_padding,
                                        paddingVertical: theme.internal_padding_2,
                                    }}
                                />

                                {suggestions.length > 0 && clientSelectionneId === null && (
                                    <View style={{ gap: 3, overflow: 'hidden', borderRadius: theme.internal_radius_2 }}>
                                        {suggestions.map((u) => (
                                            <TouchableOpacity key={u.id} style={styles.suggestion} onPress={() => choisirSuggestion(u.id, u.nom)}>
                                                <Text style={{ fontSize: theme.size_two }}>{u.nom}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                <TouchableOpacity
                                    disabled={!nomClient.trim()}
                                    onPress={() => setEtape("produits")}
                                    style={{
                                        marginTop: theme.internal_padding_2,
                                        alignItems: "center",
                                        paddingVertical: theme.internal_padding,
                                        borderRadius: theme.internal_radius_2,
                                        backgroundColor: nomClient.trim() ? "#000" : "#ccc",
                                    }}
                                >
                                    <Text style={{ fontSize: theme.size_two, color: "#fff" }}>Suivant</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <ScrollView style={{ paddingHorizontal: theme.internal_padding }}>
                                    {collections.map((collection) => (
                                        <View key={collection.id} style={{ marginBottom: theme.internal_padding }}>
                                            <Text style={{ fontSize: theme.size_one, color: "#777", marginBottom: 4 }}>{collection.name}</Text>
                                            <View style={{ gap: 3, overflow: 'hidden', borderRadius: theme.internal_radius_2 }}>
                                                {collection.produits.map((produit) => {
                                                    const qte = quantites[produit.id] ?? 0;
                                                    return (
                                                        <View key={produit.id} style={styles.button}>
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={{ fontSize: theme.size_two }}>{produit.name}</Text>
                                                                <Text style={{ fontSize: theme.size_one, color: "#777" }}>{formatMontant(produit.prix)}</Text>
                                                            </View>
                                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                                                <TouchableOpacity onPress={() => changerQuantite(produit.id, -1)} style={styles.stepper}>
                                                                    <Minus size={16} color="#000" />
                                                                </TouchableOpacity>
                                                                <Text style={{ fontSize: theme.size_two, minWidth: 18, textAlign: "center" }}>{qte}</Text>
                                                                <TouchableOpacity onPress={() => changerQuantite(produit.id, 1)} style={styles.stepper}>
                                                                    <Plus size={16} color="#000" />
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>

                                <View style={{ paddingHorizontal: theme.internal_padding, paddingBottom: insets.bottom + theme.internal_padding, paddingTop: theme.internal_padding_2, gap: 8 }}>
                                    <TouchableOpacity onPress={() => setEtape("client")}>
                                        <Text style={{ fontSize: theme.size_one, color: "#777" }}>Retour</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        disabled={total === 0}
                                        onPress={handleValiderCommande}
                                        style={{
                                            alignItems: "center",
                                            paddingVertical: theme.internal_padding,
                                            borderRadius: theme.internal_radius_2,
                                            backgroundColor: total > 0 ? "#000" : "#ccc",
                                        }}
                                    >
                                        <Text style={{ fontSize: theme.size_two, color: "#fff" }}>Valider la commande — {formatMontant(total)}</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
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
    suggestion: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: theme.internal_padding,
        paddingVertical: theme.internal_padding_2,
    },
    stepper: {
        width: 28,
        aspectRatio: 1,
        borderRadius: 14,
        backgroundColor: "#f0f0f0",
        alignItems: "center",
        justifyContent: "center",
    },
});
