#!/usr/bin/env bash

# ======================================================================
#   Aura Smart Home Cyber-Physical HVAC - macOS & Linux Launcher
# ======================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}======================================================================${NC}"
echo -e "${GREEN}   Aura Smart Home Cyber-Physical HVAC & Fuzzy Logic Controller${NC}"
echo -e "${CYAN}                    macOS & Linux Universal Launcher${NC}"
echo -e "${CYAN}======================================================================${NC}\n"

# 1. Verify Prerequisites
echo -e "${YELLOW}[1/5] Checking Python 3...${NC}"
if command -v python3 >/dev/null 2>&1; then
    PY_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PY_CMD="python"
else
    echo -e "${RED}[ERROR] Python 3 is not installed or not in PATH!${NC}"
    echo "Please install Python 3.10+ from https://python.org or via your package manager."
    exit 1
fi
echo -e "  Found: $($PY_CMD --version)"

echo -e "${YELLOW}[2/5] Checking Node.js and npm...${NC}"
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Node.js or npm is not installed or not in PATH!${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org or via nvm."
    exit 1
fi
echo -e "  Found Node: $(node --version), npm: $(npm --version)"

# 2. Setup Python Virtual Environment
echo -e "${YELLOW}[3/5] Setting up Backend Virtual Environment...${NC}"
if [ ! -f ".venv/bin/python" ]; then
    echo "  Creating virtual environment (.venv)..."
    $PY_CMD -m venv .venv
    echo "  Installing dependencies from requirements.txt..."
    ./.venv/bin/python -m pip install --upgrade pip
    ./.venv/bin/python -m pip install -r requirements.txt
else
    echo "  Virtual environment (.venv) already exists."
fi

# 3. Setup Frontend Dependencies
echo -e "${YELLOW}[4/5] Checking Frontend Dependencies...${NC}"
if [ ! -d "frontend/node_modules" ]; then
    echo "  Installing npm dependencies in ./frontend..."
    (cd frontend && npm install)
else
    echo "  Frontend node_modules verified."
fi

# 4. Clean exit trap handler
cleanup() {
    echo -e "\n${YELLOW}Shutting down Aura services...${NC}"
    kill "$BACKEND_PID" 2>/dev/null || true
    kill "$FRONTEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
    wait "$FRONTEND_PID" 2>/dev/null || true
    echo -e "${GREEN}Services stopped successfully.${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 5. Launch Services
echo -e "${YELLOW}[5/5] Launching Services...${NC}"
echo "  Starting FastAPI backend on http://127.0.0.1:8000..."
./.venv/bin/python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "  Starting Next.js frontend on http://localhost:3000..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "  Waiting for servers to initialize..."
sleep 4

# Open Browser
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3000" >/dev/null 2>&1 &
elif command -v open >/dev/null 2>&1; then
    open "http://localhost:3000" >/dev/null 2>&1 &
fi

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}  Aura is running!${NC}"
echo -e "  - Frontend UI:  ${CYAN}http://localhost:3000${NC}"
echo -e "  - Backend Docs: ${CYAN}http://127.0.0.1:8000/docs${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo -e "${YELLOW}Press Ctrl+C in this terminal to shut down both servers.${NC}\n"

wait
