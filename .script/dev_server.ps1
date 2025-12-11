# Set window size
[console]::WindowWidth=120
[console]::WindowHeight=30
[console]::BufferWidth=[console]::WindowWidth

# Set title
$host.ui.RawUI.WindowTitle = "TetraLog Game Story Test Server"

Set-Location -LiteralPath (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
Remove-Item "public" -Recurse -ErrorAction "Ignore"
Remove-Item "resources" -Recurse -ErrorAction "Ignore"
# Fast Render: Home page + Content page last edited (if any) + Content page last visited (up to 10)
# Note: Using port 80 will break Header Menu active state
hugo server --renderToMemory --disableFastRender -D -p 44
#hugo server --renderToMemory --printMemoryUsage -D -p 80
