fx_version "cerulean"
game "gta5"
lua54 'yes'
author "Jarvis"
version "2.0.0"
use_experimental_fxv2_oal 'yes'
--[[ node_version '22' ]]
server_scripts {
    "build/server.js",
}
ui_page 'web/dist/index.html'
shared_script '@ox_lib/init.lua'
files { 'web/dist/index.html', 'web/dist/**/*.js', 'config.json' }
client_scripts {
    "build/client.js",
    "client.lua"
}