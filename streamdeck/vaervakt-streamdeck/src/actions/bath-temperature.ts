import { BaseVaervaktAction, vaervaktAction } from "./base-vaervakt-action";

@vaervaktAction("no.vaervakt.streamdeck.bath")
export class BathTemperatureAction extends BaseVaervaktAction {
  constructor() {
    super("bath");
  }
}
