import {
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
  DidReceiveSettingsEvent,
} from "@elgato/streamdeck";
import { fetchVaervaktWeather, submitQuickReport } from "../lib/vaervakt-api";
import { makeKeyImage } from "../lib/key-image";
import { normalizeSettings, type VaervaktSettings } from "../settings";
import { vaervaktAction } from "./base-vaervakt-action";

@vaervaktAction("no.vaervakt.streamdeck.quick-report")
export class QuickReportAction extends SingletonAction<VaervaktSettings> {
  override async onWillAppear(ev: WillAppearEvent<VaervaktSettings>): Promise<void> {
    await this.renderIdle(ev.action, ev.payload.settings);
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<VaervaktSettings>): Promise<void> {
    await this.renderIdle(ev.action, ev.payload.settings);
  }

  override async onKeyDown(ev: KeyDownEvent<VaervaktSettings>): Promise<void> {
    const settings = normalizeSettings(ev.payload.settings);
    await ev.action.setTitle("");
    await ev.action.setImage(
      makeKeyImage({
        mode: "report",
        placeName: settings.placeName,
        reportCondition: settings.reportCondition,
        status: "loading",
      }),
    );

    try {
      const weather = await fetchVaervaktWeather(settings);
      await submitQuickReport(settings, weather);
      await ev.action.setImage(
        makeKeyImage({
          mode: "report",
          placeName: settings.placeName,
          reportCondition: settings.reportCondition,
          status: "success",
        }),
      );
      setTimeout(() => void this.renderIdle(ev.action, ev.payload.settings), 1800);
    } catch (error) {
      await ev.action.setImage(
        makeKeyImage({
          mode: "report",
          placeName: settings.placeName,
          reportCondition: settings.reportCondition,
          status: "error",
          message: error instanceof Error ? error.message : "Kunne ikke sende",
        }),
      );
    }
  }

  private async renderIdle(
    actionInstance: WillAppearEvent<VaervaktSettings>["action"],
    rawSettings: VaervaktSettings,
  ): Promise<void> {
    const settings = normalizeSettings(rawSettings);
    await actionInstance.setTitle("");
    await actionInstance.setImage(
      makeKeyImage({
        mode: "report",
        placeName: settings.placeName,
        reportCondition: settings.reportCondition,
        status: "ok",
      }),
    );
  }
}
