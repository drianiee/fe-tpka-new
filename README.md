# FE TPKA Docker Guide

## Prasyarat
- Backend sudah jalan (default: `http://localhost:8000`)
- File env tersedia: `.env.dev` untuk development, `.env.prod` untuk production

## Development
Jalankan frontend Next.js dengan hot reload:

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

Endpoint:
- Frontend: `http://localhost:${FE_PORT:-3000}`

## Production
Jalankan frontend production:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## Command bantu
Lihat status:

```bash
docker compose -f docker-compose.dev.yml ps
```

Lihat log frontend:

```bash
docker compose -f docker-compose.dev.yml logs -f fe
```

Stop service:

```bash
docker compose -f docker-compose.dev.yml down
```
