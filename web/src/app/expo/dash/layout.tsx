"use client"

import { ExpoEnterpriseShell } from "[@BASE]/features/expo/components/expo-enterprise-shell"

export default function ExpoDashLayout({ children }: { children: React.ReactNode }) {
    return <ExpoEnterpriseShell>{children}</ExpoEnterpriseShell>
}
