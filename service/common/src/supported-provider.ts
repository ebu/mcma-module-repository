export const supportedProviders = ["AWS" , "Azure", "Google"] as const;

export type SupportedProvider = typeof supportedProviders[number];

export function isSupportedProvider(provider: string): provider is SupportedProvider {
    return !!provider && supportedProviders.some(x => x.toLowerCase() === provider.toLowerCase());
}