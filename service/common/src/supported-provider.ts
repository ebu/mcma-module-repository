import { McmaException } from "@mcma/core";

export const supportedProviders = ["AWS" , "Azure", "Google", "Kubernetes"] as const;
export type SupportedProvider = typeof supportedProviders[number];

function matchSupportedProvider(provider: string): SupportedProvider {
    return supportedProviders.find(x => x.toLowerCase() === provider.toLowerCase());
}

export function normalizeProvider(provider: string): SupportedProvider {
    if (!isSupportedProvider(provider)) {
        throw new McmaException(`Provider '${provider}' is not supported. Currently supported providers are: ${supportedProviders.join(", ")}`);
    }
    return matchSupportedProvider(provider);
}

export function isSupportedProvider(provider: string): provider is SupportedProvider {
    return !!provider && !!matchSupportedProvider(provider);
}