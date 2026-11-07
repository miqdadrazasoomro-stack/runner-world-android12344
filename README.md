# RUNNER WORLD 3D - project source

Structure
- index.html        page and all menu/HUD markup
- css/style.css     all styling
- js/game.js        the whole game: save system, audio, Three.js scene, trains/ramps/coins logic, controls, menus
- js/lib/three.min.js  Three.js r128 - REQUIRED for the Android app (it must be inside the APK; the CDN fallback does not work offline)
- assets/reference-images/  your reference images (NOT used by the game at runtime)

Notes
- All graphics (trains, character, environment, textures) are generated in code. All sounds and music are generated with WebAudio. There are no separate image or audio files to ship.
- Online dependencies: Three.js r128 (cdnjs; replace with js/lib/three.min.js) and the Lilita One font (Google Fonts; falls back to Impact when offline. To bundle it, download the font and add an @font-face rule in css/style.css).
- Progress is saved in localStorage under the key rw3d_save_v1.

Run locally: serve this folder (for example `python3 -m http.server`) and open it in a browser.

Android (Capacitor):
1. Make sure js/lib/three.min.js is committed to GitHub (check .gitignore does not exclude *.min.js or js/lib).
2. Put only the web files in a www/ folder (index.html, css/, js/). Do NOT use --web-dir=. - that would pack the project root (and the big reference images) into the APK.
3. npm init -y && npm i @capacitor/core @capacitor/cli @capacitor/android
4. npx cap init "Runner World" com.example.runnerworld --web-dir=www
5. npx cap add android && npx cap sync
6. npx cap open android, then build the APK in Android Studio (or via GitHub Actions).

Troubleshooting: if the game cannot start its 3D engine, a red message now appears at the bottom of the screen
(e.g. "3D engine (three.min.js) did not load") instead of the buttons silently doing nothing.
