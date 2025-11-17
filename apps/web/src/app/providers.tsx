"use client";

import { ThemeProvider } from "@/components/provider/theme-provider";

type Provider = ({ children }: { children: React.ReactNode }) => JSX.Element;

const providers: Provider[] = [
    (props) => (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            {...props}
        />
    ),
];

export function Providers({ children }: { children: React.ReactNode }) {
    return providers.reduceRight((acc, Provider) => {
        return <Provider>{acc}</Provider>;
    }, children);
}
