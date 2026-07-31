import { Container } from "./container";
import { Text } from "./text";


import theme from "@/constantes/constant-style"

export default function Titre({ titre }: { titre: string }) {
    return (
        <Container style={{ marginTop: theme.size_three, marginBottom: theme.internal_padding_2 }}>

            <Text style={{ fontSize: theme.size_two, color: "#838383" }}>{titre}</Text>
        </Container>
    )
}