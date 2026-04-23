import { redirect } from "next/navigation"

export default function LegacyExpoPasswordRedirectPage() {
    redirect("/expo/dash/settings/password")
}
