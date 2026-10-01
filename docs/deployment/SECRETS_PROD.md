# Production Secret Management (Infisical)

Status: active
Projekt: `flipbook-advantage`

Diese Anleitung beschreibt, wie die produktiven Secrets von `flipbook-advantage` aus
Infisical (self-hosted) geladen werden, wie MongoDB als Replica Set startet und
was vor dem ersten Deploy einzurichten ist.

## Uebersicht

Auf dem Prod-Server liegen nur `INFISICAL_TOKEN`, `INFISICAL_API_URL` und
`INFISICAL_PROJECT_ID` in der `.env`. Alle anderen Secrets werden zur Laufzeit
per `infisical run` als Entrypoint-Wrapper in die Container-Umgebung injiziert
(`app`, `mongo`, `mongo-init` in `docker-compose.yml`).

Der Dev-Workflow (`.env`, `docker-compose.dev.yml`, `npm run dev:docker`)
bleibt unveraendert und nutzt weder Infisical noch `--auth`.

```text
Prod-Server
├─ Infisical-Stack (separat)      Secrets Projekt "flipbook-advantage", Environment "prod"
└─ App-Stack (docker-compose.yml)
   ├─ mongo       infisical run -- mongo-keyfile-entrypoint.sh mongod --auth --replSet rs0
   ├─ mongo-init  infisical run -- mongo-replset-init.sh   (einmalig, idempotent)
   └─ app         infisical run -- node server.js
```

## Setup-Schritte

### 1. Infisical bereitstellen

Infisical laeuft als eigener Docker-Stack, damit App-Deploys den Secret Manager
nicht mit neu starten. Installation und Betrieb: offizielle Anleitung unter
<https://infisical.com/docs/self-hosting/overview>. Image auf einen konkreten
Tag pinnen und bewusst upgraden.

### 2. Projekt, Environment und Machine Identity

1. In Infisical ein Projekt (z.B. `flipbook-advantage`) mit dem Environment `prod` anlegen.
2. Unter **Project Settings → Access Control → Machine Identities** eine
   Identity mit Universal Auth und der Rolle *Read Secrets* (nur `prod`) anlegen.
3. **Client ID** und **Client Secret** kopieren (das Secret wird nur einmal
   angezeigt) sowie die **Project ID** (kein Secret).
4. Token erzeugen, ohne das Client Secret in der Shell-History zu hinterlassen:

   ```bash
   read -s INFISICAL_CLIENT_SECRET
   infisical login --method=universal-auth \
     --client-id=<client-id> \
     --client-secret="$INFISICAL_CLIENT_SECRET" \
     --domain=https://infisical.werk1.internal \
     --silent --plain
   unset INFISICAL_CLIENT_SECRET
   ```

   Die Ausgabe ist der Wert fuer `INFISICAL_TOKEN`. Das Client Secret nie als
   Kommandozeilenparameter uebergeben (`ps`, Shell-History).

### 3. Secrets in Infisical eintragen (Environment `prod`)

Genau diese Secrets werden von den erzeugten Compose-Dateien, Dockerfiles und
dem Mongo-Image gelesen:

| Secret | Gelesen von | Beschreibung |
|--------|-------------|--------------|
| `PAYLOAD_SECRET` | `app` | Session-/JWT-Signierung von Payload |
| `MONGODB_URI` | `app` | Connection-String mit App-DB-User, siehe unten |
| `MONGO_INITDB_ROOT_USERNAME` | `mongo`, `mongo-init` | Mongo-Admin; legt bei leerem `mongo-data` den Root-User an und authentifiziert `rs.initiate()` |
| `MONGO_INITDB_ROOT_PASSWORD` | `mongo`, `mongo-init` | Passwort dazu |
| `MONGO_KEYFILE_B64` | `mongo` | Keyfile fuer die interne Replica-Set-Authentifizierung |
| `APP_FONTS_GOOGLE_API_KEY` | `app` | Optional: Google-Fonts-Katalog/Import fuer App Fonts |

`MONGO_KEYFILE_B64` einmal pro Umgebung erzeugen:

```bash
openssl rand -base64 756 | tr -d '\n'
```

Den Wert unveraendert (eine Zeile, nicht erneut Base64-kodieren) eintragen. Das
Image enthaelt **kein** Keyfile: `mongo-keyfile-entrypoint.sh` schreibt den Wert
beim Container-Start nach `/etc/mongo-keyfile` (`chmod 400`, `chown 999:999`)
und startet erst dann `mongod`. Fehlt das Secret, bricht der Container mit einer
Fehlermeldung ab.

### 4. `.env` auf dem Prod-Server

```env
INFISICAL_TOKEN=<machine-identity-token>
INFISICAL_API_URL=https://infisical.werk1.internal
INFISICAL_PROJECT_ID=<uuid-aus-project-settings>
NEXT_PUBLIC_SERVER_URL=https://<oeffentliche-url>
APP_PORT=<port>
```

`INFISICAL_TOKEN` ist ein Secret; `INFISICAL_PROJECT_ID`, `NEXT_PUBLIC_SERVER_URL`
und `APP_PORT` sind es nicht. Sonst gehoert kein Secret in diese Datei.

### 5. Mongo-Image bauen

Das Mongo-Image (`<image>-mongo`) enthaelt die Infisical-CLI sowie
`mongo-keyfile-entrypoint.sh` und `mongo-replset-init.sh`. Es wird nur gebaut,
wenn beim Push `BUILD_MONGO_IMAGE=true` gesetzt ist (Default: nein). Beim ersten
Deploy und nach jeder Aenderung an `autodeploy/multi/Dockerfile_Mongo` muss es
neu gebaut werden. BuildKit mit Heredoc-Unterstuetzung ist noetig (Docker 23+).

## MongoDB als Replica Set

Payload nutzt MongoDB-Transaktionen und braucht deshalb ein Replica Set. Die
erzeugte Prod-Compose startet `mongod` mit `--auth --keyFile /etc/mongo-keyfile
--replSet rs0`. Zwei Bausteine sorgen dafuer, dass ohne Handarbeit ein
funktionierender Primary entsteht:

- **`mongo-init`** ist ein einmaliger Service (`restart: "no"`). Er wartet auf
  `mongo:27017`, fuehrt `rs.initiate()` mit den Root-Credentials aus und tut nichts,
  wenn das Replica Set schon existiert. Ein erneutes `docker compose up -d`
  ist deshalb gefahrlos. Logs: `docker compose logs mongo-init`.
- Der **Healthcheck** von `mongo` meldet erst `healthy`, wenn ein Primary
  existiert (`db.hello().isWritablePrimary`). `app` startet erst danach
  (`depends_on: condition: service_healthy`).

Bei einem Neustart mit bestehendem `mongo-data` bleibt die Replica-Set-
Konfiguration erhalten; `mongo` waehlt selbst wieder einen Primary.

### App-DB-User anlegen

Die App soll sich nicht mit dem Root-User verbinden. Nach dem ersten Start
(`mongo` ist `healthy`) einmalig einen User in der App-Datenbank anlegen:

```bash
docker compose exec mongo mongosh -u "<root-user>" -p --authenticationDatabase admin
```

```javascript
use flipbook-advantage
db.createUser({
  user: "<app-user>",
  pwd: passwordPrompt(),
  roles: [{ role: "readWrite", db: "flipbook-advantage" }]
})
```

### MONGODB_URI

```text
mongodb://<app-user>:<passwort>@mongo:27017/flipbook-advantage?replicaSet=rs0
```

- `replicaSet=rs0` ist erforderlich; der Host `mongo` ist im Compose-Netzwerk
  aufloesbar und entspricht dem Member-Namen, den `mongo-init` registriert.
- Der User liegt in `flipbook-advantage`, daher ist `authSource` implizit `flipbook-advantage`.
  Wird der User in `admin` angelegt, `&authSource=admin` anhaengen.
- Sonderzeichen im Passwort URL-kodieren.

## Erster Deploy auf leerem Server

1. Infisical-Projekt, Machine Identity und alle Secrets aus der Tabelle anlegen.
2. `.env` auf dem Server setzen, Mongo-Image mit `BUILD_MONGO_IMAGE=true` bauen.
3. `docker compose up -d`. `mongo-init` initialisiert das Replica Set.
4. Warten bis `docker compose ps` `mongo` als `healthy` zeigt.
5. App-DB-User anlegen (siehe oben) und `MONGODB_URI` in Infisical setzen.
6. `docker compose restart app`, damit `app` die neue URI aus Infisical laedt.

Da `app` erst nach einem gesunden `mongo` startet und `MONGODB_URI` bis Schritt 5
fehlt, schlaegt der erste App-Start davor fehl (`restart: unless-stopped` startet
ihn erneut). Das ist erwartet.

## Rotation

- **Token:** In Infisical altes Client Secret loeschen, neues erzeugen, mit dem
  Befehl aus Schritt 2 einen neuen Token erzeugen, in `.env` eintragen,
  `docker compose up -d --force-recreate` (die Token-Variable wird beim Erstellen
  der Container gesetzt).
- **Secret:** Wert in Infisical aendern, betroffenen Service neu starten
  (`docker compose restart app` bzw. `mongo`); Secrets werden nur beim
  Container-Start geladen. `.env` bleibt unveraendert.
- **`MONGO_KEYFILE_B64`:** Der Wert muss auf allen Mitgliedern des Replica Sets
  identisch sein. Bei dieser Single-Node-Konfiguration reicht ein Neustart von
  `mongo` nach der Aenderung in Infisical.
- **Root-Passwort:** `MONGO_INITDB_ROOT_*` wirkt nur beim ersten Start mit leerem
  `mongo-data`. Passwort eines bestehenden Users in `mongosh` mit
  `db.changeUserPassword()` aendern und den Wert danach in Infisical nachziehen,
  damit `mongo-init` weiter authentifizieren kann.

## Bestehende Installationen

Apps, die vor dieser Anleitung mit Infisical deployt wurden, tragen ein im
Mongo-Image eingebackenes Keyfile und haben das Replica Set von Hand
initialisiert. Umstellung: `MONGO_KEYFILE_B64` in Infisical anlegen, Mongo-Image
neu bauen (`BUILD_MONGO_IMAGE=true`), neue `docker-compose.yml` ausrollen. Bei
einem einzelnen Mongo-Knoten spielt der neue Keyfile-Wert keine Rolle fuer
bestehende Daten; `mongo-init` erkennt das vorhandene Replica Set und aendert
nichts.

## Troubleshooting

| Symptom | Ursache / Loesung |
|---------|-------------------|
| `mongo` startet nicht, Log: `MONGO_KEYFILE_B64 is required` | Secret fehlt in Infisical (`prod`). Eintragen und Container neu starten. |
| `mongo` bleibt `unhealthy`, kein Primary | `docker compose logs mongo-init` pruefen: Root-Credentials fehlen oder sind falsch, oder `mongo` war nicht erreichbar. |
| `mongo-init`: `MONGO_INITDB_ROOT_USERNAME and MONGO_INITDB_ROOT_PASSWORD are required` | Beide Secrets in Infisical setzen. Bei bestehendem `mongo-data` ohne Root-User zuerst einen User anlegen (Localhost-Exception in `mongosh` im Container). |
| App: `NotYetInitialized` / `no primary` | Replica Set nicht initialisiert: `docker compose run --rm mongo-init` ausfuehren. |
| App: `Authentication failed` | `MONGODB_URI`: falscher User/`authSource`, oder App-DB-User fehlt. |
| `Failed to authenticate` beim Start | Token abgelaufen: Token rotieren (siehe oben). |
| `Project ID is required when using machine identity` | `INFISICAL_PROJECT_ID` in `.env` setzen. |
| `connect ECONNREFUSED` zu Infisical | Infisical-Stack pruefen, `INFISICAL_API_URL` korrigieren. |

## Verifikation

- `docker compose -f docker-compose.yml config` laeuft ohne Fehler.
- `docker compose ps`: `mongo` `healthy`, `mongo-init` `exited (0)`.
- `docker run --rm --entrypoint sh <image>-mongo test -e /etc/mongo-keyfile`
  schlaegt fehl: Das Image enthaelt kein Keyfile.
- `docker compose exec app env | grep PAYLOAD_SECRET` zeigt den Wert aus Infisical.
- Ausser `INFISICAL_TOKEN` steht kein Secret in der `.env` auf dem Server.
