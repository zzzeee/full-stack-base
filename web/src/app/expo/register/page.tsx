import { redirect } from "next/navigation"

export default function ExpoRegisterDisabledPage() {
    redirect("/expo/login")
}
