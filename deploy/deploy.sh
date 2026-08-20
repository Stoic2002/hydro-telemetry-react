#!/usr/bin/env bash
#
# Rilis dashboard telemetering ke staging atau production.
#
#   ./deploy/deploy.sh staging
#   ./deploy/deploy.sh production
#
# Dijalankan di server, sebagai user biasa (bukan root). Perintah systemctl di
# dalamnya memakai sudo, jadi password mungkin diminta sekali.
#
# Opsi:
#   --yes           lewati konfirmasi production
#   --skip-pull     bangun ulang dari kode yang sudah ada, tanpa git pull
#   --ref <sha>     checkout revisi tertentu lebih dulu (untuk rollback)

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$REPO_DIR/.deploy-state"

readonly COLOR_OFF=$'\033[0m'
readonly COLOR_INFO=$'\033[1;36m'
readonly COLOR_WARN=$'\033[1;33m'
readonly COLOR_FAIL=$'\033[1;31m'
readonly COLOR_OK=$'\033[1;32m'

info() { printf '%s==>%s %s\n' "$COLOR_INFO" "$COLOR_OFF" "$*"; }
warn() { printf '%s!! %s %s\n' "$COLOR_WARN" "$COLOR_OFF" "$*"; }
ok()   { printf '%s ok%s %s\n' "$COLOR_OK" "$COLOR_OFF" "$*"; }
die()  { printf '%sGAGAL%s %s\n' "$COLOR_FAIL" "$COLOR_OFF" "$*" >&2; exit 1; }

# --- argumen ---------------------------------------------------------------

ENVIRONMENT="${1:-}"
shift || true

ASSUME_YES=false
SKIP_PULL=false
TARGET_REF=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes) ASSUME_YES=true; shift ;;
    --skip-pull) SKIP_PULL=true; shift ;;
    --ref) TARGET_REF="${2:-}"; [[ -n "$TARGET_REF" ]] || die "--ref butuh nilai"; shift 2 ;;
    *) die "opsi tidak dikenal: $1" ;;
  esac
done

case "$ENVIRONMENT" in
  staging)
    SERVICE="hydro-telemetry-frontend-staging"
    BUILD_SCRIPT="build:staging"
    OUT_DIR="dist-staging"
    ENV_FILE=".env.staging"
    PORT=4174
    ;;
  production)
    SERVICE="hydro-telemetry-frontend"
    BUILD_SCRIPT="build"
    OUT_DIR="dist"
    ENV_FILE=".env.production"
    PORT=4173
    ;;
  *)
    die "pemakaian: $0 {staging|production} [--yes] [--skip-pull] [--ref <sha>]"
    ;;
esac

cd "$REPO_DIR"
mkdir -p "$STATE_DIR"

# --- pemeriksaan awal ------------------------------------------------------

[[ $EUID -ne 0 ]] || die "jangan jalankan sebagai root; hasil build akan dimiliki root"

# Tanpa file env, build TIDAK error - ia diam-diam mundur ke nilai default dan
# menghasilkan bundle yang menunjuk backend yang salah. Ini harus dicegat.
[[ -f "$ENV_FILE" ]] || die "$ENV_FILE tidak ada. Build akan menunjuk backend yang salah tanpa peringatan. Buat file itu lebih dulu."

grep -q '^VITE_API_BASE_URL=.\+' "$ENV_FILE" \
  || die "VITE_API_BASE_URL kosong di $ENV_FILE"

if [[ -n "$(git status --porcelain)" ]]; then
  warn "ada perubahan lokal yang belum di-commit di server:"
  git status --short | sed 's/^/    /'
  $ASSUME_YES || { read -rp "Lanjutkan? [y/N] " reply; [[ "$reply" == [yY] ]] || exit 1; }
fi

# --- ambil kode ------------------------------------------------------------

PREVIOUS_SHA="$(git rev-parse HEAD)"

if [[ -n "$TARGET_REF" ]]; then
  info "checkout $TARGET_REF"
  git checkout --quiet "$TARGET_REF"
elif $SKIP_PULL; then
  info "melewati git pull"
else
  info "menarik perubahan"
  git pull --ff-only
fi

CURRENT_SHA="$(git rev-parse HEAD)"

if [[ "$PREVIOUS_SHA" != "$CURRENT_SHA" ]]; then
  info "perubahan yang akan dirilis:"
  git --no-pager log --oneline "$PREVIOUS_SHA..$CURRENT_SHA" 2>/dev/null | sed 's/^/    /' || true
else
  info "tidak ada commit baru; membangun ulang $CURRENT_SHA"
fi

# --- pengaman production ---------------------------------------------------

if [[ "$ENVIRONMENT" == "production" ]]; then
  STAGING_SHA_FILE="$STATE_DIR/staging-sha"
  if [[ ! -f "$STAGING_SHA_FILE" ]]; then
    warn "revisi ini belum pernah dirilis ke staging"
  elif [[ "$(cat "$STAGING_SHA_FILE")" != "$CURRENT_SHA" ]]; then
    warn "staging sedang menjalankan revisi lain ($(cut -c1-7 < "$STAGING_SHA_FILE"))"
  fi

  if ! $ASSUME_YES; then
    read -rp "Rilis $(git rev-parse --short HEAD) ke PRODUCTION? [y/N] " reply
    [[ "$reply" == [yY] ]] || { git checkout --quiet "$PREVIOUS_SHA" 2>/dev/null || true; exit 1; }
  fi
fi

# --- bangun ----------------------------------------------------------------

info "memasang dependency"
bun install --frozen-lockfile

info "membangun $ENVIRONMENT"
bun run "$BUILD_SCRIPT"

[[ -f "$OUT_DIR/index.html" ]] || die "$OUT_DIR/index.html tidak terbentuk"

# --- muat ulang service ----------------------------------------------------

info "memuat ulang $SERVICE"
sudo systemctl restart "$SERVICE"

# vite preview membaca daftar file saat start, jadi beri waktu sebelum dicek.
for _ in {1..10}; do
  sleep 1
  if curl -fsS -o /dev/null "http://localhost:$PORT/"; then
    break
  fi
done

systemctl is-active --quiet "$SERVICE" \
  || die "$SERVICE tidak aktif. Lihat: sudo journalctl -u $SERVICE -n 50"

curl -fsS -o /dev/null "http://localhost:$PORT/" \
  || die "port $PORT tidak merespons. Lihat: sudo journalctl -u $SERVICE -n 50"

[[ "$ENVIRONMENT" == "staging" ]] && echo "$CURRENT_SHA" > "$STATE_DIR/staging-sha"

# --- selesai ---------------------------------------------------------------

ok "$ENVIRONMENT berjalan pada revisi $(git rev-parse --short HEAD), port $PORT"
echo
warn "Server statisnya hidup, tapi itu belum membuktikan aplikasinya jalan."
echo "    Buka http://<host-server>:$PORT lalu LOGIN - di situlah request pertama"
echo "    ke backend terjadi. Lanjutkan ke Overview, Telemetering, Tren, Laporan."
echo
if [[ "$ENVIRONMENT" == "production" ]]; then
  echo "    Rollback: ./deploy/deploy.sh production --ref $(echo "$PREVIOUS_SHA" | cut -c1-7)"
fi
