import { Fragment, useEffect, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    LinearTransition,
    useAnimatedProps,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";
import theme from "@/constantes/constant-style";
import { Text } from "@/components/text";
import { formatMontant } from "@/utils/format";

export type RecetteDetteTrendPoint = {
    /** Jour ISO (yyyy-mm-dd), sert de clé stable. */
    jour: string;
    /** Libellé court affiché sous la barre ("12/07"). */
    label: string;
    recette: number;
    dette: number;
};

const GOUTTIERE = 34;
const HAUTEUR_CHART = 130;
const HAUTEUR_LABELS = 18;
const HAUTEUR_TOTAL = HAUTEUR_CHART + HAUTEUR_LABELS;
const LARGEUR_BARRE_MAX = 16;
const ECART_BARRES = 3;
const TAILLE_LABEL_DATE = 11;

const DUREE_CROISSANCE = 420;
const DUREE_SELECTION = 160;
const DECALAGE_PAR_BARRE = 45;

const COULEUR_RECETTE = "#16a34a";
const COULEUR_DETTE = "#D64545";
const COULEUR_AXE = "#e5e7eb";

function formaterMontant(montant: number): string {
    return formatMontant(montant);
}

function formaterMontantCourt(montant: number): string {
    if (montant >= 1000) {
        const milliers = montant / 1000;
        return `${milliers % 1 === 0 ? milliers : milliers.toFixed(1)}k`;
    }
    return `${montant}`;
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export function RecetteDetteTrendChart({ data }: { data: RecetteDetteTrendPoint[] }) {
    const [largeur, setLargeur] = useState(0);
    const [jourSelectionne, setJourSelectionne] = useState<string | null>(null);

    if (data.length === 0) return null;

    const totalRecette = data.reduce((somme, d) => somme + d.recette, 0);
    const totalDette = data.reduce((somme, d) => somme + d.dette, 0);

    const max = Math.max(1, ...data.map((d) => Math.max(d.recette, d.dette)));
    const echelle = (valeur: number) => (Math.max(0, valeur) / max) * (HAUTEUR_CHART - 8);

    const largeurTrace = Math.max(0, largeur - GOUTTIERE);
    const largeurGroupe = largeurTrace / data.length;
    const largeurBarre = Math.max(3, Math.min(LARGEUR_BARRE_MAX, (largeurGroupe - 8 - ECART_BARRES) / 2));

    const selection = data.find((d) => d.jour === jourSelectionne) ?? null;
    const graduations = [0, 0.5, 1];

    function onLayout(e: LayoutChangeEvent) {
        setLargeur(e.nativeEvent.layout.width);
    }

    return (
        <Animated.View
            layout={LinearTransition.duration(220)}
            style={{ backgroundColor: "white", borderRadius: theme.internal_radius, padding: theme.internal_padding, gap: theme.internal_padding }}
        >
            <View style={{ gap: 2 }}>
                <Text style={{ fontSize: theme.size_two, fontWeight: "bold" }}>Recette & dette</Text>
                <Text style={{ fontSize: theme.size_one, opacity: 0.6 }}>
                    {formaterMontant(totalRecette)} de recette · {formaterMontant(totalDette)} de dette sur {data.length} jour{data.length > 1 ? "s" : ""}
                </Text>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.internal_padding }}>
                {[
                    { label: "Recette", couleur: COULEUR_RECETTE },
                    { label: "Dette", couleur: COULEUR_DETTE },
                ].map((legende) => (
                    <View key={legende.label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: legende.couleur }} />
                        <Text style={{ fontSize: theme.size_one, opacity: 0.6 }}>{legende.label}</Text>
                    </View>
                ))}
            </View>

            <View onLayout={onLayout} style={{ width: "100%", height: HAUTEUR_TOTAL }}>
                {largeur > 0 && (
                    <Svg width={largeur} height={HAUTEUR_TOTAL}>
                        {graduations.map((ratio) => {
                            const y = HAUTEUR_CHART - ratio * (HAUTEUR_CHART - 8);
                            return (
                                <Fragment key={ratio}>
                                    <Line x1={GOUTTIERE} y1={y} x2={largeur} y2={y} stroke={COULEUR_AXE} strokeWidth={1} />
                                    <SvgText x={GOUTTIERE - 6} y={y + 3} fontSize={theme.size_one - 2} fill="#000" opacity={0.45} textAnchor="end">
                                        {formaterMontantCourt(max * ratio)}
                                    </SvgText>
                                </Fragment>
                            );
                        })}

                        {data.map((point, index) => (
                            <BarreJour
                                key={point.jour}
                                point={point}
                                delai={index * DECALAGE_PAR_BARRE}
                                gaucheGroupe={GOUTTIERE + index * largeurGroupe}
                                largeurGroupe={largeurGroupe}
                                largeurBarre={largeurBarre}
                                hauteurRecette={echelle(point.recette)}
                                hauteurDette={echelle(point.dette)}
                                estSelectionne={point.jour === jourSelectionne}
                                onPress={() => setJourSelectionne((precedent) => (precedent === point.jour ? null : point.jour))}
                            />
                        ))}
                    </Svg>
                )}
            </View>

            {selection && (
                <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} layout={LinearTransition.duration(220)}>
                    <DetailJour point={selection} />
                </Animated.View>
            )}
        </Animated.View>
    );
}

type BarreJourProps = {
    point: RecetteDetteTrendPoint;
    delai: number;
    gaucheGroupe: number;
    largeurGroupe: number;
    largeurBarre: number;
    hauteurRecette: number;
    hauteurDette: number;
    estSelectionne: boolean;
    onPress: () => void;
};

function BarreJour({
    point,
    delai,
    gaucheGroupe,
    largeurGroupe,
    largeurBarre,
    hauteurRecette,
    hauteurDette,
    estSelectionne,
    onPress,
}: BarreJourProps) {
    const recette = useSharedValue(0);
    const dette = useSharedValue(0);
    const surbrillance = useSharedValue(0);

    // Les barres poussent depuis la ligne de base au montage, et se retendent
    // vers leur nouvelle valeur quand les données changent.
    useEffect(() => {
        const config = { duration: DUREE_CROISSANCE, easing: Easing.out(Easing.cubic) };
        recette.value = withDelay(delai, withTiming(hauteurRecette, config));
        dette.value = withDelay(delai, withTiming(hauteurDette, config));
    }, [hauteurRecette, hauteurDette, delai, recette, dette]);

    useEffect(() => {
        surbrillance.value = withTiming(estSelectionne ? 1 : 0, { duration: DUREE_SELECTION });
    }, [estSelectionne, surbrillance]);

    const propsSurbrillance = useAnimatedProps(() => ({ opacity: surbrillance.value * 0.08 }));

    const propsRecette = useAnimatedProps(() => {
        const hauteur = Math.max(0.01, recette.value);
        return { y: HAUTEUR_CHART - hauteur, height: hauteur };
    });

    const propsDette = useAnimatedProps(() => {
        const hauteur = Math.max(0.01, dette.value);
        return { y: HAUTEUR_CHART - hauteur, height: hauteur };
    });

    const centre = gaucheGroupe + largeurGroupe / 2;
    const xRecette = centre - largeurBarre - ECART_BARRES / 2;
    const xDette = centre + ECART_BARRES / 2;

    return (
        <Fragment>
            <AnimatedRect
                x={gaucheGroupe}
                y={0}
                width={largeurGroupe}
                height={HAUTEUR_CHART}
                fill={COULEUR_RECETTE}
                rx={4}
                animatedProps={propsSurbrillance}
            />

            <AnimatedRect x={xRecette} width={largeurBarre} rx={2} fill={COULEUR_RECETTE} animatedProps={propsRecette} />
            <AnimatedRect x={xDette} width={largeurBarre} rx={2} fill={COULEUR_DETTE} animatedProps={propsDette} />

            <SvgText x={centre} y={HAUTEUR_TOTAL - 4} fontSize={TAILLE_LABEL_DATE} fill="#000" opacity={0.55} textAnchor="middle">
                {point.label}
            </SvgText>

            <Rect x={gaucheGroupe} y={0} width={largeurGroupe} height={HAUTEUR_TOTAL} fill="transparent" onPress={onPress} />
        </Fragment>
    );
}

function DetailJour({ point }: { point: RecetteDetteTrendPoint }) {
    const solde = point.recette - point.dette;
    return (
        <View style={{ backgroundColor: "#f5f5f5", borderRadius: theme.internal_radius_2, padding: theme.internal_padding, gap: 6 }}>
            <Text style={{ fontSize: theme.size_one, fontWeight: "bold" }}>{point.label}</Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: theme.size_one, opacity: 0.7 }}>Recette</Text>
                <Text style={{ fontSize: theme.size_one, color: COULEUR_RECETTE, fontWeight: "bold" }}>{formaterMontant(point.recette)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: theme.size_one, opacity: 0.7 }}>Dette</Text>
                <Text style={{ fontSize: theme.size_one, color: COULEUR_DETTE, fontWeight: "bold" }}>{formaterMontant(point.dette)}</Text>
            </View>

            <View style={{ height: 1, backgroundColor: "#e5e7eb", marginVertical: 2 }} />

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: theme.size_one, fontWeight: "bold" }}>Solde</Text>
                <Text style={{ fontSize: theme.size_one, fontWeight: "bold" }}>{formaterMontant(solde)}</Text>
            </View>
        </View>
    );
}
