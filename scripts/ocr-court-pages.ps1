param([Parameter(Mandatory=$true)][string]$Folder, [Parameter(Mandatory=$true)][string]$Prefix)
# Read-only Windows OCR helper: rendered page images in, JSON on stdout.
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime]
function Await-WinRT($Operation, $ResultType) {
  $method = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
  } | Select-Object -First 1
  $task = $method.MakeGenericMethod($ResultType).Invoke($null, @($Operation))
  $task.GetAwaiter().GetResult()
}
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if ($null -eq $engine) { throw 'No Windows OCR language installed.' }
$results = @()
foreach ($imageFile in (Get-ChildItem -LiteralPath $Folder -Filter "$Prefix-*.png" | Sort-Object Name)) {
  $file = Await-WinRT ([Windows.Storage.StorageFile]::GetFileFromPathAsync($imageFile.FullName)) ([Windows.Storage.StorageFile])
  $stream = Await-WinRT ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
  try {
    $decoder = Await-WinRT ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap = Await-WinRT ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
    try {
      $recognized = Await-WinRT ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
      $page = [int]($imageFile.BaseName -replace '^.*-(\d+)$','$1')
      $results += @{ page = $page; text = (($recognized.Lines | ForEach-Object { $_.Text }) -join "`n") }
    } finally { $bitmap.Dispose() }
  } finally { $stream.Dispose() }
}
ConvertTo-Json -InputObject $results -Depth 4 -Compress

