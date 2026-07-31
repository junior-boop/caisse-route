import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";

import { useDatabase } from "@/contexts/database-context";
import {
    afficherNotificationSession,
    demanderPermissionsNotifications,
    initialiserCanalSession,
    masquerNotificationSession,
} from "@/utils/notifications";

export function SessionNotificationBridge() {
    const router = useRouter();
    const { sessionDuJour, mouvements } = useDatabase();
    const sessionOuverteRef = useRef(false);

    useEffect(() => {
        initialiserCanalSession();

        const subscription = Notifications.addNotificationResponseReceivedListener((reponse) => {
            const sessionId = reponse.notification.request.content.data?.sessionId;
            if (sessionId) router.push(`/session/${sessionId}` as any);
        });

        return () => subscription.remove();
    }, [router]);

    useEffect(() => {
        if (!sessionDuJour || sessionDuJour.fermee) {
            if (sessionOuverteRef.current) {
                masquerNotificationSession();
                sessionOuverteRef.current = false;
            }
            return;
        }

        const mouvementsSession = mouvements.filter((m) => m.session_id === sessionDuJour.id);
        const totalCommandes = mouvementsSession.filter((m) => m.type === "dette").length;
        const clientIds = Array.from(new Set(mouvementsSession.filter((m) => m.type === "dette").map((m) => m.client_id)));
        const totalCouverts = clientIds.filter((clientId) => {
            const solde = mouvements.filter((m) => m.client_id === clientId).reduce((total, m) => total + m.montant * m.sens, 0);
            return solde <= 0;
        }).length;

        (async () => {
            const autorise = await demanderPermissionsNotifications();
            if (!autorise) return;
            await afficherNotificationSession(sessionDuJour.id, totalCommandes, totalCouverts);
            sessionOuverteRef.current = true;
        })();
    }, [sessionDuJour, mouvements]);

    return null;
}
