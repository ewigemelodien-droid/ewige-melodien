# Ewige Melodien - Christliche Musik Streaming Platform

## Über das Projekt
Ewige Melodien ist eine moderne Web-App für christliche Musik-Streaming, ähnlich wie Spotify, aber speziell für christliche Inhalte entwickelt. Die Plattform bietet kostenloses Streaming, Playlist-Erstellung, Musik-Kauf und Download-Funktionen.

## Funktionen
- ✅ Kostenloses Musik-Streaming (nach Registrierung)
- ✅ Benutzerkonten mit JWT-Authentifizierung
- ✅ Playlist-Erstellung und Verwaltung
- ✅ Musik-Shop mit Kauf- und Download-Funktion
- ✅ Stripe und PayPal Zahlungsintegration
- ✅ Modernes, responsives Design (dunkles Theme)
- ✅ Deutsche Benutzeroberfläche
- ✅ SQLite Datenbank (kein externer DB-Server nötig)

## Technologie-Stack
- **Backend**: Node.js, Express.js
- **Datenbank**: SQLite3
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Zahlungen**: Stripe, PayPal
- **Authentifizierung**: JWT, bcryptjs

## Installation

### 1. Voraussetzungen
- Node.js 18+ oder 20+
- npm

### 2. Installation
```bash
npm install
```

### 3. Umgebungsvariablen
Kopieren Sie `.env.example` zu `.env` und füllen Sie die Werte aus:
```
PORT=3000
JWT_SECRET=Ihr_geheimes_JWT_Secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
PAYPAL_CLIENT_ID=Ihre_PayPal_Client_ID
PAYPAL_CLIENT_SECRET=Ihr_PayPal_Secret
```

### 4. Starten
```bash
npm start
```

Die App läuft dann unter `http://localhost:3000`

## Namecheap cPanel Deployment

### Schritt 1: Dateien hochladen
1. Loggen Sie sich in Ihr cPanel ein
2. Öffnen Sie den **File Manager**
3. Navigieren Sie zu `public_html`
4. Laden Sie alle Projektdateien hoch

### Schritt 2: Node.js App einrichten
1. Suchen Sie im cPanel nach **Setup Node.js App**
2. Klicken Sie auf **Create Application**
3. Konfigurieren Sie:
   - **Node.js version**: 18.x oder 20.x
   - **Application root**: `public_html` (oder Ihr Unterordner)
   - **Application URL**: `EwigeMelodien.de`
   - **Application startup file**: `server.js`
4. Klicken Sie auf **Create**

### Schritt 3: Abhängigkeiten installieren
Im cPanel Terminal oder via SSH:
```bash
cd public_html
npm install
```

### Schritt 4: Umgebungsvariablen setzen
Bearbeiten Sie die `.env` Datei im File Manager und tragen Sie Ihre API-Schlüssel ein.

### Schritt 5: App starten
Klicken Sie im Node.js App Manager auf **Restart**.

## Musik-Dateien hinzufügen
1. Legen Sie Ihre MP3-Dateien in `public/music/` ab
2. Legen Sie Cover-Bilder in `public/music/covers/` ab
3. Aktualisieren Sie die Datenbank oder fügen Sie Tracks über die API hinzu

## Wichtige Hinweise
- **SSL aktivieren**: Stellen Sie sicher, dass SSL/HTTPS für Ihre Domain aktiviert ist (wichtig für Zahlungen)
- **Stripe**: Verwenden Sie Test-Schlüssel für Tests, Live-Schlüssel für Production
- **PayPal**: Konfigurieren Sie Sandbox für Tests, Live für Production
- **Backup**: Sichern Sie regelmäßig die `database.sqlite` Datei

## Lizenz
MIT License

## Kontakt
info@ewigemelodien.de


## 👨‍💼 Admin Panel

### Accessing Admin Panel
1. Go to `https://your-site.com/admin`
2. Login with your user credentials
3. If you see "Admin Zugriff erforderlich", you need to make yourself admin first

### Making Yourself Admin

**Option 1: Before first deploy (recommended)**
Register a user on the website first, then run:
```bash
node setup-admin.js your-email@example.com
```

**Option 2: Direct database edit**
If you have access to the server:
```bash
sqlite3 database.sqlite
UPDATE users SET is_admin = 1 WHERE email = 'your-email@example.com';
.quit
```

**Option 3: Via environment variable (emergency)**
Set `ADMIN_EMAIL=your-email@example.com` in `.env` and restart.

### Admin Features
- 📊 **Dashboard**: View stats (users, music, sales, revenue)
- 🎵 **Music Management**: Add, edit, delete tracks with file upload
- 👥 **User Management**: View users, promote to admin, delete
- 🛒 **Sales Tracking**: View all purchases and revenue
- ⚙️ **Settings**: Update site information

### Adding Music
1. Go to Admin Panel → Musik Verwalten
2. Click "Neue Musik"
3. Fill in details (title, artist, price, etc.)
4. Upload cover image (optional)
5. Upload MP3 file (optional)
6. Save

### File Upload Limits
- Max file size depends on your hosting
- On Render Free: ~100MB per file
- For larger files, use cloud storage (AWS S3, Cloudinary)
