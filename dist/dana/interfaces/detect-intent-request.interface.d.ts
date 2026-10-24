export interface DanaModelConfig {
    ModelName: string;
    systemPrompt: string;
    reasoning: boolean;
    temperature: number;
    maxToken: number;
}
export interface DanaUserInfo {
    userQuery: string;
    username: string;
    history: unknown[];
    historyCount: number;
}
export interface DetectIntentRequest {
    UserInfo: DanaUserInfo;
    ModelConfigs: DanaModelConfig;
}
export interface DetectIntentResponse {
    intent: string;
}
