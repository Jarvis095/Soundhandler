fx_version "cerulean"
game "gta5"

author "Jarvis"
version "2.0.0"

server_scripts {
    "build/server.js",
}
ui_page 'web/dist/index.html'
--[[ ui_page 'http://localhost:3000/' ]]
files { 'web/dist/index.html', 'web/**/*', 'config.json' }
client_scripts {
    "build/client.js",
}