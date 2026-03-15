# System SterilGuard Pro - Backend

## Instalacja

```bash
npm install
```

## Konfiguracja bazy danych

1. Upewnij się, że masz zainstalowany PostgreSQL
2. Utwórz bazę danych `steril_guard_db`
3. Zaktualizuj `DATABASE_URL` w pliku `.env`

## Migracje

```bash
npx prisma generate
npx prisma migrate dev
```

## Uruchomienie

```bash
npm run dev
```

Aplikacja dostępna będzie pod adresem: http://localhost:3000
