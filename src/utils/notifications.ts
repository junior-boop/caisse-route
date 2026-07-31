import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const ID_NOTIFICATION_SESSION = "session-en-cours";
const CANAL_SESSION = "session";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

export async function demanderPermissionsNotifications() {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") return true;
    const { status: nouveauStatus } = await Notifications.requestPermissionsAsync();
    return nouveauStatus === "granted";
}

export async function initialiserCanalSession() {
    if (Platform.OS !== "android") return;
    await Notifications.setNotificationChannelAsync(CANAL_SESSION, {
        name: "Session en cours",
        importance: Notifications.AndroidImportance.DEFAULT,
    });
}

export async function afficherNotificationSession(sessionId: number, totalCommandes: number, totalCouverts: number) {
    await Notifications.scheduleNotificationAsync({
        identifier: ID_NOTIFICATION_SESSION,
        content: {
            title: "Session en cours",
            body: `${totalCommandes} commande${totalCommandes > 1 ? "s" : ""} · ${totalCouverts} couvert${totalCouverts > 1 ? "s" : ""}`,
            sticky: true,
            autoDismiss: false,
            data: { sessionId },
            ...(Platform.OS === "android" ? { channelId: CANAL_SESSION } : {}),
        },
        trigger: null,
    });
}

export async function masquerNotificationSession() {
    await Notifications.dismissNotificationAsync(ID_NOTIFICATION_SESSION).catch(() => { });
}
