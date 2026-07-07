import streamDeck, {
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
  WillDisappearEvent,
  DidReceiveSettingsEvent,
} from "@elgato/streamdeck";
import { fetchLatestReport } from "../lib/vaervakt-api";
import { makeKeyImage } from "../lib/key-image";
import { normalizeSettings, type VaervaktSettings } from "../settings";
import { vaervaktAction } from "./base-vaervakt-action";

@vaervaktAction("no.vaervakt.streamdeck.latest-report")
export class LatestReportAction extends SingletonAction<VaervaktSettings> {
  private timers = new Map<string, NodeJS.Timeout>();

  override async onWillAppear(ev: WillAppearEvent<VaervaktSettings>): Promise<void> {
    await this.refresh(ev.action, ev.payload.settings);
    this.scheduleRefresh(ev.action, ev.payload.settings);
  }

  override onWillDisappear(ev: WillDisappearEvent<VaervaktSettings>): void {
    this.clearRefresh(ev.action.id);
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<VaervaktSettings>): Promise<void> {
    await this.refresh(ev.action, ev.payload.settings);
    this.scheduleRefresh(ev.action, ev.payload.settings);
  }

  override async onKeyDown(ev: KeyDownEvent<VaervaktSettings>): Promise<void> {
    const settings = normalizeSettings(ev.payload.settings);
    await this.refresh(ev.action, ev.payload.settings);

    if (settings.openOnPress) {
      await streamDeck.system.openUrl(`${settings.apiBase}/lokalt/`);
    }
  }

  private scheduleRefresh(actionInstance: WillAppearEvent<VaervaktSettings>["action"], settings: VaervaktSettings): void {
    this.clearRefresh(actionInstance.id);
    const normalized = normalizeSettings(settings);
    const timer = setInterval(() => {
      void this.refresh(actionInstance, settings);
    }, Number(normalized.refreshMinutes) * 60 * 1000);
    this.timers.set(actionInstance.id, timer);
  }

  private clearRefresh(actionId: string): void {
    const timer = this.timers.get(actionId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(actionId);
    }
  }

  private async refresh(
    actionInstance: WillAppearEvent<VaervaktSettings>["action"],
    rawSettings: VaervaktSettings,
  ): Promise<void> {
    const settings = normalizeSettings(rawSettings);
    await actionInstance.setTitle("");
    await actionInstance.setImage(
      makeKeyImage({
        mode: "latest",
        placeName: settings.placeName,
        status: "loading",
      }),
    );

    try {
      const report = await fetchLatestReport(settings);
      await actionInstance.setImage(
        makeKeyImage({
          mode: "latest",
          placeName: settings.placeName,
          latestReport: report,
          status: "ok",
        }),
      );
    } catch (error) {
      await actionInstance.setImage(
        makeKeyImage({
          mode: "latest",
          placeName: settings.placeName,
          status: "error",
          message: error instanceof Error ? error.message : "Kunne ikke hente rapport",
        }),
      );
    }
  }
}
