import { BaseVaervaktAction, vaervaktAction } from "./base-vaervakt-action";

@vaervaktAction("no.vaervakt.streamdeck.now")
export class WeatherNowAction extends BaseVaervaktAction {
  constructor() {
    super("weather");
  }
}
