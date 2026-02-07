#!/bin/bash
# LagSlayer — kill ping, boost stability.
# Usage: sudo ./lagslayer.sh [gaming|streaming|dev|reset]

need_sudo() {
  if [ "$EUID" -ne 0 ]; then
    echo "LagSlayer needs root. Re-run with: sudo $0 [mode]"
    exit 1
  fi
}

set_kv() {
  sysctl -w "$1=$2" >/dev/null
}

have_bbr() {
  grep -qw bbr /proc/sys/net/ipv4/tcp_available_congestion_control
}

apply_common() {
  set_kv net.core.rmem_max 16777216
  set_kv net.core.wmem_max 16777216
  set_kv net.ipv4.tcp_rmem "4096 87380 16777216"
  set_kv net.ipv4.tcp_wmem "4096 65536 16777216"
  set_kv net.ipv4.tcp_fastopen 3
}

gaming() {
  echo "🎮 LagSlayer: Gaming Mode"
  set_kv net.core.default_qdisc fq
  if have_bbr; then set_kv net.ipv4.tcp_congestion_control bbr; else set_kv net.ipv4.tcp_congestion_control cubic; fi
  apply_common
}

streaming() {
  echo "📡 LagSlayer: Streaming Mode"
  set_kv net.core.default_qdisc fq
  if have_bbr; then set_kv net.ipv4.tcp_congestion_control bbr; else set_kv net.ipv4.tcp_congestion_control cubic; fi
  # bigger write window for steady uploads
  set_kv net.ipv4.tcp_wmem "4096 131072 33554432"
  set_kv net.core.wmem_max 33554432
  apply_common
}

dev() {
  echo "👨‍💻 LagSlayer: Dev Mode"
  set_kv net.core.default_qdisc fq
  set_kv net.ipv4.tcp_congestion_control cubic
  apply_common
}

reset() {
  echo "🔄 LagSlayer: Reset to sane defaults"
  # Prefer fq_codel if available, else fall back
  if modprobe -n sch_fq_codel 2>/dev/null; then
    set_kv net.core.default_qdisc fq_codel
  else
    set_kv net.core.default_qdisc pfifo_fast
  fi
  set_kv net.ipv4.tcp_congestion_control cubic
  set_kv net.ipv4.tcp_fastopen 1
  set_kv net.core.rmem_max 212992
  set_kv net.core.wmem_max 212992
  set_kv net.ipv4.tcp_rmem "4096 87380 6291456"
  set_kv net.ipv4.tcp_wmem "4096 16384 4194304"
}

print_status() {
  echo "---- Current netstack ----"
  sysctl net.core.default_qdisc | sed 's/^/• /'
  sysctl net.ipv4.tcp_congestion_control | sed 's/^/• /'
  sysctl net.ipv4.tcp_fastopen | sed 's/^/• /'
  sysctl net.core.rmem_max net.core.wmem_max | sed 's/^/• /'
  sysctl net.ipv4.tcp_rmem net.ipv4.tcp_wmem | sed 's/^/• /'
  echo "--------------------------"
}

main() {
  case "$1" in
    gaming|streaming|dev|reset) ;;
    *)
      cat <<EOF
LagSlayer — usage:
  sudo ./lagslayer.sh gaming     # low latency focus
  sudo ./lagslayer.sh streaming  # upload stability
  sudo ./lagslayer.sh dev        # coding/general
  sudo ./lagslayer.sh reset      # restore sane defaults
EOF
  exit 1
      ;;
  esac

 need_sudo
  "$1"
  echo "🚀 LagSlayer applied: $1"
  # Best effort DNS cache flush (won't error if not using systemd-resolved)
  systemd-resolve --flush-caches 2>/dev/null || resolvectl flush-caches 2>/dev/null || true
  print_status
}

main "$@"
