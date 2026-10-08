# Getingo Angular

A Getingo Angular 20 frontendje. Ez a könyvtár az egyetlen kanonikus frontend forrás; korábbi `ang/`, beágyazott `getingo_ang-main/`, `dist/` és `.angular/` másolatokat ne tarts a repóban.

## Követelmények

- Node.js 22+
- npm
- futó Getingo Laravel API

## Telepítés és fejlesztés

```bash
npm ci
npm start -- --proxy-config proxy.conf.json
```

Alapértelmezett frontend: `http://localhost:4200`.

A proxy a helyi Laravel API felé továbbítja az API/CSRF kéréseket. A frontend **Sanctum session-cookie + CSRF** hitelesítést használ, ezért az API kérések `withCredentials` módban futnak. Ne vezess vissza `localStorage` bearer tokent.

## Production build

```bash
npm ci
npm run build
```

A `dist/` build output és az `.angular/` cache nem verziózott forrás; ne csomagold vissza a repositoryba.

## Tesztek

```bash
npm test -- --watch=false
```

A kritikus folyamatok, amelyeket release előtt külön ellenőrizni kell:

- regisztráció + email-verifikáció;
- forgot/reset password;
- projekt Start / Restart / lejárat / ellenőrzés;
- Premium checkout és visszatérés;
- admin törölt-felhasználó flow;
- light/dark theme fő oldaltípusokon;
- Buddy betöltés mobilon.

## Témázás

A globális light/dark színek közös theme tokenekre épülnek. Új komponensnél a `src/styles/_theme-tokens.scss` / globális `--g-*` változókat használd; ne adj újabb teljes oldalas `body.dark-theme ... !important` felülírási réteget.

## 3D Buddy assetek

A GLB-k optimalizált változatok. Új modellt csak optimalizálva adj a repóhoz; cél productionben Draco/Meshopt + WebP/KTX2 pipeline. A nagy, nem használt PNG/GLB másolatokat ne tartsd bent.

## Git munkafolyamat

Egy repository legyen a frontendhez. Új munka külön branch-en készüljön, például:

```bash
git switch -c feature/project-start
git add .
git commit -m "Add explicit project start flow"
git push -u origin feature/project-start
```

A `main (5).zip` jellegű párhuzamos projektmásolatok helyett merge/PR őrizze meg a változások történetét.

## Release blocker

A `LEGAL_PUBLISH_CHECKLIST.md` szerinti valós üzemeltetői/jogi adatokat éles publikálás előtt ki kell tölteni. Ezeket a repository nem találhatja ki automatikusan.
