import streamDeck, {
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
  DidReceiveSettingsEvent,
} from "@elgato/streamdeck";
import { makeKeyImage } from "../lib/key-image";
import { normalizeSettings, type VaervaktSettings } from "../settings";
import { vaervaktAction } from "./base-vaervakt-action";

@vaervaktAction("no.vaervakt.streamdeck.open")
export class OpenVaervaktAction extends SingletonAction<VaervaktSettings> {
  override async onWillAppear(ev: WillAppearEvent<VaervaktSettings>): Promise<void> {
    await this.render(ev.action, ev.payload.settings);
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<VaervaktSettings>): Promise<void> {
    await this.render(ev.action, ev.payload.settings);
  }

  override async onKeyDown(ev: KeyDownEvent<VaervaktSettings>): Promise<void> {
    const settings = normalizeSettings(ev.payload.settings);
    await streamDeck.system.openUrl(settings.apiBase);
  }

  private async render(
    actionInstance: WillAppearEvent<VaervaktSettings>["action"],
    rawSettings: VaervaktSettings,
  ): Promise<void> {
    const settings = normalizeSettings(rawSettings);
    await actionInstance.setTitle("");
    await actionInstance.setImage(
      makeKeyImage({
        mode: "open",
        placeName: settings.placeName,
        status: "ok",
      }),
    );
  }
}
