# Værvakt React

Ny React-basert base for Værvakt.no, bygget videre fra en fork av
`vardhan-venkata/react-weather-forecast`.

## Hva denne basen gjør nå

- Henter værdata fra Meteorologisk institutt via MET Locationforecast.
- Søker etter steder via OpenStreetMap Nominatim.
- Krever ingen OpenWeather- eller RapidAPI-nøkler.
- Starter med Kristiansand som standardvisning.
- Viser vær nå, time-for-time og de neste dagene.

## Repo-flyt

Dette repoet er utviklingsrepoet for React/UI. Produksjonsrepoet er
`LordM8YT/Vaervakt.no`, og det er det eneste repoet som deployer til Webhuset.

Når React-kode pushes til `main`, bygger GitHub Actions appen og sender ferdig
build videre til `LordM8YT/Vaervakt.no`. Produksjonsrepoet deployer deretter til
Webhuset med den eksisterende workflowen.

Secret som må ligge i dette repoet:

```text
VAERVAKT_SYNC_TOKEN
```

Tokenet må ha skrivetilgang til `LordM8YT/Vaervakt.no`.

## Kjør lokalt

```powershell
npm install
npm start
```

## Bygg

```powershell
npm run build
```

## Videre arbeid

- Lage ny Værvakt-identitet og mobil-first UI.
- Koble inn egne rapporter, badetemperatur og Værhub.
- Legge inn PWA/service worker når ny struktur er stabil.
