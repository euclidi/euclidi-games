$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
function Invoke-Checked([string]$Program, [string[]]$Arguments) {
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Program failed with exit $LASTEXITCODE" }
}
Invoke-Checked 'cmake' @('-S','.','-B','build-native','-A','x64','-DBB_NATIVE=ON')
Invoke-Checked 'cmake' @('--build','build-native','--config','Release')
Invoke-Checked 'ctest' @('--test-dir','build-native','-C','Release','--output-on-failure')
Invoke-Checked 'cmake' @('--install','build-native','--config','Release','--prefix','stage1-bin')
Write-Host 'Native build and non-graphics tests passed. Run stage1-bin/runtime_probe.exe --smoke on target hardware to validate graphics.'
