# Source from Bash before running PluginLabs commands in Codex Cloud.
# Dependencies are retained; processes and exported variables must be restarted.
export npm_config_cache=/workspace/.npm-cache
export electron_config_cache=/workspace/.cloud-setup/electron-cache
export ELECTRON_BUILDER_CACHE=/workspace/.cloud-setup/electron-builder-cache
export XDG_CONFIG_HOME=/workspace/.cloud-setup/config
export XDG_CACHE_HOME=/workspace/.cloud-setup/cache
export ELECTRON_GET_USE_PROXY=1
export GLOBAL_AGENT_HTTP_PROXY="${HTTP_PROXY:-}"
export GLOBAL_AGENT_HTTPS_PROXY="${HTTPS_PROXY:-}"
mkdir -p "$npm_config_cache" "$electron_config_cache" "$ELECTRON_BUILDER_CACHE" "$XDG_CONFIG_HOME" "$XDG_CACHE_HOME"
