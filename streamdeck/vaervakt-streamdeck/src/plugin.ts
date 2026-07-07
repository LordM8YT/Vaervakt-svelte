import streamDeck from "@elgato/streamdeck";
import { BathInfoAction } from "./actions/bath-info";
import { BathTemperatureAction } from "./actions/bath-temperature";
import { LatestReportAction } from "./actions/latest-report";
import { OpenVaervaktAction } from "./actions/open-vaervakt";
import { QuickReportAction } from "./actions/quick-report";
import { WeatherNowAction } from "./actions/weather-now";

streamDeck.actions.registerAction(new WeatherNowAction());
streamDeck.actions.registerAction(new BathTemperatureAction());
streamDeck.actions.registerAction(new BathInfoAction());
streamDeck.actions.registerAction(new LatestReportAction());
streamDeck.actions.registerAction(new QuickReportAction());
streamDeck.actions.registerAction(new OpenVaervaktAction());

streamDeck.connect();
