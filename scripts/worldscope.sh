#!/usr/bin/env bash
# WorldScope bootstrap and restart helper.
#
# One entry point for a fresh machine and for daily restarts. Safe to re-run:
# it never overwrites .env and never removes volumes without an explicit
# interactive confirmation.
#
# Usage:
#   scripts/worldscope.sh bootstrap [--install] [--no-pull] [--mode dev|full|infra]
#   scripts/worldscope.sh restart [--mode dev|full|infra] [--build] [--force]
#   scripts/worldscope.sh dev|full|infra [--force]
#   scripts/worldscope.sh stop [--purge]
#   scripts/worldscope.sh status|doctor|help
#   scripts/worldscope.sh logs [service]

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

NVM_VERSION="v0.41.0"
PNPM_VERSION="12.23.0"
COMPOSE=()
DOCKER_MODE=""

log() { printf '\033[1;36m[worldscope]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[worldscope]\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31m[worldscope]\033[0m %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
WorldScope helper

Commands:
  bootstrap   Pull, check/install prerequisites, create .env, install deps,
              apply migrations and start the app (default mode: dev)
  restart     Restart data services and the app without pulling or installing
  dev         Data services in Compose + API/web on the host (foreground)
  full        All services in Compose containers
  infra       Only PostgreSQL and Redis in Compose
  stop        docker compose down (volumes are kept)
  status      Container state and health endpoints
  logs        Follow Compose logs; pass a service name to filter
  doctor      Report prerequisites, .env and port usage
  help        Show this text

Flags:
  --install   Install missing Docker/Node/pnpm prerequisites (needs sudo)
  --no-pull   Do not run git pull during bootstrap
  --mode      dev|full|infra (default: dev)
  --build     Rebuild images in full mode
  --purge     Delete Postgres/Redis volumes in stop (asks for confirmation)
  --force     Stop processes occupying API/web ports before starting dev
EOF
}

command_name="${1:-help}"
if [ "$#" -gt 0 ]; then shift; fi

DO_INSTALL=0
DO_PULL=1
DO_BUILD=0
DO_RESTART=0
PURGE=0
FORCE=0
MODE="dev"
EXTRA=()

while [ "$#" -gt 0 ]; do
  case "$1" in
    --install) DO_INSTALL=1 ;;
    --no-pull) DO_PULL=0 ;;
    --build) DO_BUILD=1 ;;
    --purge) PURGE=1 ;;
    --force) FORCE=1 ;;
    --mode)
      shift
      [ "$#" -gt 0 ] || die "--mode requires dev, full or infra"
      MODE="$1"
      ;;
    *)
      if [ "$command_name" = "logs" ]; then EXTRA+=("$1"); else die "unknown option: $1"; fi
      ;;
  esac
  shift
done

case "$command_name" in
  bootstrap | setup) DO_RESTART=0 ;;
  restart | dev | full | infra) DO_RESTART=1 ;;
  stop | status | logs | doctor | help) ;;
  *) die "unknown command: $command_name (try: $0 help)" ;;
esac

case "$MODE" in
  dev | full | infra) ;;
  *) die "invalid --mode '$MODE' (use dev, full or infra)" ;;
esac

install_node() {
  log "Node 24 not found. Installing nvm $NVM_VERSION and Node $(cat .nvmrc)"
  command -v curl >/dev/null 2>&1 || die "curl is required to install nvm"
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    curl -fsSL "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh" | bash
  fi
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm install "$(cat .nvmrc)"
  nvm use "$(cat .nvmrc)"
}

check_node() {
  if ! command -v node >/dev/null 2>&1; then
    if [ "$DO_INSTALL" -eq 1 ]; then
      install_node
    else
      die "Node 24 is required. Install it with nvm (nvm install) or re-run with --install."
    fi
  fi
  local major
  major="$(node -p 'process.versions.node.split(".")[0]')"
  [ "$major" = "24" ] || die "Node 24 is required, found $(node --version). See .nvmrc."
}

ensure_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    local version
    version="$(pnpm --version)"
    [ "$version" = "$PNPM_VERSION" ] || warn "pnpm $version found; this repo pins $PNPM_VERSION in package.json."
    return
  fi
  command -v corepack >/dev/null 2>&1 || die "corepack is missing; enable it in your Node installation."
  corepack enable || die "corepack enable failed (try running with sudo if Node is system-wide)."
  corepack prepare "pnpm@$PNPM_VERSION" --activate
  log "pnpm $PNPM_VERSION enabled through corepack"
}

install_docker() {
  if [ -n "${OSTYPE:-}" ] && [[ "$OSTYPE" != linux* ]]; then
    die "Automatic Docker installation supports Linux only. Install Docker Desktop manually."
  fi
  grep -qiE 'debian|ubuntu' /etc/os-release || die "Automatic installation supports Debian/Ubuntu-based distributions only."
  log "Installing Docker Engine and Compose v2 with apt (sudo password will be requested)..."
  sudo apt-get update
  sudo apt-get install -y docker.io docker-compose-v2
  sudo systemctl enable --now docker
  sudo usermod -aG docker "$(id -un)" || true
  log "Docker installed. If 'docker info' fails, run 'newgrp docker' or log out and back in."
}

detect_compose() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    COMPOSE=(docker compose)
  elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE=(docker-compose)
  elif command -v podman >/dev/null 2>&1 && podman compose version >/dev/null 2>&1; then
    COMPOSE=(podman compose)
  elif command -v podman-compose >/dev/null 2>&1; then
    COMPOSE=(podman-compose)
  else
    return 1
  fi
}

dc() {
  if [ "$DOCKER_MODE" = "sudo" ]; then
    sudo "${COMPOSE[@]}" "$@"
  else
    "${COMPOSE[@]}" "$@"
  fi
}

ensure_docker() {
  if ! detect_compose; then
    if [ "$DO_INSTALL" -eq 1 ]; then
      install_docker
      detect_compose || die "Docker Compose still unavailable after installation."
    else
      die "Docker Compose v2 not found. Run '$0 bootstrap --install' first."
    fi
  fi
  if [ "${COMPOSE[0]}" = "docker" ] && ! docker info >/dev/null 2>&1; then
    DOCKER_MODE="sudo"
    warn "Docker daemon is not accessible as $USER; using sudo for Compose commands."
  fi
}

load_env() {
  local create="${1:-1}"
  if [ ! -f .env ]; then
    [ "$create" -eq 1 ] || return 0
    [ -f .env.example ] || die ".env.example is missing"
    cp .env.example .env
    log "Created .env from .env.example (review it before production use)"
  fi
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
}

port_pids() {
  ss -ltnp "( sport = :$1 )" 2>/dev/null \
    | grep -o 'pid=[0-9]*' \
    | cut -d= -f2 \
    | sort -u \
    || true
}

stop_dev() {
  local port pid pgid own_pgid i busy
  own_pgid="$(ps -o pgid= -p $$ 2>/dev/null | tr -d ' ')"
  declare -A stopped_groups=()

  for port in "${API_PORT:-3000}" "${WEB_PORT:-5173}"; do
    for pid in $(port_pids "$port"); do
      pgid="$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d ' ')"
      [ -n "$pgid" ] || continue
      # Killing only the child lets `nest start --watch` respawn it and keep
      # the port busy. Stop the whole process group instead.
      if [ "$pgid" = "$own_pgid" ]; then
        warn "PID $pid shares this script's process group; stopping only that PID"
        kill -TERM "$pid" 2>/dev/null || true
        continue
      fi
      if [ -z "${stopped_groups[$pgid]:-}" ]; then
        log "Stopping process group $pgid listening on port $port"
        kill -TERM -- "-$pgid" 2>/dev/null || true
        stopped_groups[$pgid]=1
      fi
    done
  done

  # Wait until the ports are actually free before a new `pnpm dev` starts.
  for i in $(seq 1 15); do
    busy=0
    for port in "${API_PORT:-3000}" "${WEB_PORT:-5173}"; do
      if [ -n "$(port_pids "$port")" ]; then busy=1; fi
    done
    if [ "$busy" -eq 0 ]; then return 0; fi
    sleep 1
  done
  warn "Ports are still busy after stopping dev servers (check: '$0 doctor')"
}

ensure_ports_free() {
  local port pids busy=0
  for port in "${API_PORT:-3000}" "${WEB_PORT:-5173}"; do
    pids="$(port_pids "$port")"
    if [ -n "$pids" ]; then
      warn "Port $port is in use by PID(s): $(echo "$pids" | tr '\n' ' ')"
      busy=1
    fi
  done
  if [ "$busy" -eq 1 ]; then
    if [ "$FORCE" -eq 1 ]; then
      stop_dev
    else
      die "API/web ports are busy. Stop them first or re-run with --force."
    fi
  fi
}

wait_for_postgres() {
  local i
  log "Waiting for PostgreSQL to accept connections..."
  for i in $(seq 1 60); do
    if dc exec -T postgres pg_isready -q \
      -U "${POSTGRES_USER:-worldscope}" -d "${POSTGRES_DB:-worldscope}" >/dev/null 2>&1; then
      log "PostgreSQL is ready"
      return 0
    fi
    sleep 1
  done
  die "PostgreSQL did not become ready in 60s (check: $0 logs postgres)"
}

wait_for_http() {
  local url="$1" name="$2" i
  for i in $(seq 1 60); do
    if curl -fsS --max-time 3 "$url" >/dev/null 2>&1; then
      log "$name ready at $url"
      return 0
    fi
    sleep 1
  done
  warn "$name not ready yet at $url (check: $0 logs)"
}

start_infra() {
  ensure_docker
  if [ "$DO_RESTART" -eq 1 ] && dc restart postgres redis >/dev/null 2>&1; then
    log "Restarted PostgreSQL and Redis containers"
  else
    dc up -d postgres redis
  fi
  wait_for_postgres
}

start_dev() {
  start_infra
  pnpm db:generate
  pnpm db:deploy
  ensure_ports_free
  log "Starting API on :${API_PORT:-3000} and web on :${WEB_PORT:-5173} (Ctrl+C to stop)"
  exec pnpm dev
}

start_full() {
  ensure_docker
  if [ "$DO_BUILD" -eq 1 ]; then
    dc up -d --build
  elif [ "$DO_RESTART" -eq 1 ] && dc restart >/dev/null 2>&1; then
    log "Restarted all containers"
  else
    dc up -d
  fi
  wait_for_http "http://127.0.0.1:${API_PORT:-3000}/api/v1/health/live" "API"
  wait_for_http "http://127.0.0.1:${WEB_CONTAINER_PORT:-8080}/" "Web"
}

start_by_mode() {
  case "$MODE" in
    dev) start_dev ;;
    full) start_full ;;
    infra) start_infra ;;
  esac
}

do_bootstrap() {
  check_node
  ensure_pnpm
  if [ "$DO_PULL" -eq 1 ]; then
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      log "Pulling latest changes from origin..."
      git pull --ff-only || warn "git pull failed (local changes or no upstream); continuing with the current tree."
    else
      warn "Not a git repository; skipping pull."
    fi
  fi
  load_env
  log "Installing JavaScript dependencies with the frozen lockfile..."
  pnpm install --frozen-lockfile
  start_by_mode
}

do_restart() {
  check_node
  ensure_pnpm
  load_env
  start_by_mode
}

do_stop() {
  ensure_docker
  if [ "$PURGE" -eq 1 ]; then
    warn "This deletes the PostgreSQL and Redis volumes (all favourites and saved comparisons)."
    read -r -p "Type 'yes' to confirm: " answer
    [ "$answer" = "yes" ] || die "Aborted; volumes were kept."
    dc down -v
  else
    dc down
  fi
  log "Containers stopped (run '$0 dev' or '$0 restart' to start again)"
}

do_status() {
  ensure_docker
  dc ps
  echo
  load_env
  wait_for_http "http://127.0.0.1:${API_PORT:-3000}/api/v1/health" "API health"
  wait_for_http "http://127.0.0.1:5173/" "Web dev server"
  wait_for_http "http://127.0.0.1:${WEB_CONTAINER_PORT:-8080}/" "Web container"
}

do_doctor() {
  log "Prerequisites"
  if command -v node >/dev/null 2>&1; then log "node $(node --version)"; else warn "node: missing"; fi
  if command -v pnpm >/dev/null 2>&1; then log "pnpm $(pnpm --version)"; else warn "pnpm: missing"; fi
  if command -v corepack >/dev/null 2>&1; then log "corepack $(corepack --version)"; else warn "corepack: missing"; fi
  if detect_compose; then log "compose: ${COMPOSE[*]}"; else warn "compose: missing"; fi
  if [ -f .env ]; then log ".env present"; else warn ".env missing (bootstrap will create it)"; fi
  load_env 0
  log "Ports"
  for port in "${API_PORT:-3000}" "${WEB_PORT:-5173}" "${WEB_CONTAINER_PORT:-8080}"; do
    pids="$(port_pids "$port")"
    if [ -n "$pids" ]; then
      warn "$port in use by PID(s): $(echo "$pids" | tr '\n' ' ')"
    else
      log "$port free"
    fi
  done
}

case "$command_name" in
  bootstrap | setup) do_bootstrap ;;
  restart | dev | full | infra) do_restart ;;
  stop) do_stop ;;
  status) do_status ;;
  logs) ensure_docker; dc logs -f "${EXTRA[@]}" ;;
  doctor) do_doctor ;;
  help) usage ;;
esac
