export const supportedPreReleaseStages = ["alpha" , "beta", "rc"] as const;

export type PreReleaseStage = typeof supportedPreReleaseStages[number];

export function isSupportPreReleaseStage(preReleaseStage: string): preReleaseStage is PreReleaseStage {
    return !!preReleaseStage && supportedPreReleaseStages.some(x => x.toLowerCase() === preReleaseStage.toLowerCase());
}