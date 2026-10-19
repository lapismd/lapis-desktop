import {
  DEFAULT_AI_SETTINGS,
  type AiPluginSettings,
} from "../../../../src/lib/ai/settings/ai-settings.ts";
export class ParticipantSettings {
  value = $state<AiPluginSettings>({ ...DEFAULT_AI_SETTINGS });
  constructor(private readonly fail = false) {}
  save = async (patch: Partial<AiPluginSettings>) => {
    if (this.fail) throw new Error("Fixture participant save unavailable");
    this.value = { ...this.value, ...patch };
  };
}
