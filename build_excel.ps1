<#
  build_excel.ps1 — turn the scraped CSV into a formatted .xlsx

  Usage:
    powershell -NoProfile -ExecutionPolicy Bypass -File .\build_excel.ps1 `
        -CsvPath .\leaders.csv `
        -OutPath C:\Users\User\espn_fantasy_football_leaders.xlsx

  What it does:
    * writes header + 8 columns (Player, Team, Pos, Status (Injury), Injury Detail,
      Opp, Status (Game), Proj)
    * Proj is stored as a real number when it parses, otherwise kept as text ("--")
    * styled header (white on ESPN blue), borders, auto-fit, frozen top row,
      autofilter table, 1-decimal format on Proj (locale-aware)
#>
param(
    [Parameter(Mandatory = $true)] [string]$CsvPath,
    [Parameter(Mandatory = $true)] [string]$OutPath
)

$ErrorActionPreference = 'Stop'

$cols = @('Player','Team','Pos','Status (Injury)','Injury Detail','Opp','Status (Game)','Proj')
$rows = Import-Csv -Path $CsvPath -Delimiter ','
if ($rows.Count -eq 0) { throw "No rows found in $CsvPath" }

$n = $rows.Count + 1
$m = $cols.Count
Write-Output "imported $($rows.Count) rows from $CsvPath"

# --- pack everything into one 2-D array so Excel gets it in a single assignment
$arr = New-Object 'object[,]' $n,$m
for ($j = 0; $j -lt $m; $j++) { $arr[0,$j] = $cols[$j] }
for ($i = 0; $i -lt $rows.Count; $i++) {
    $ri = $i + 1
    for ($j = 0; $j -lt $m; $j++) {
        $name = $cols[$j]
        $v = $rows[$i].$name
        if ($name -eq 'Proj') {
            $num = 0.0
            if ([double]::TryParse($v, [ref]$num)) { $arr[$ri,$j] = $num } else { $arr[$ri,$j] = $v }
        } else {
            $arr[$ri,$j] = $v
        }
    }
}

# Excel follows the Windows locale: "0.0" would render as 0.0 in en-US but
# needs the local decimal separator ("0,0" in fr-FR) to show 15.8 properly.
$sep = [System.Globalization.CultureInfo]::CurrentCulture.NumberFormat.NumberDecimalSeparator
$projFormat = '0' + $sep + '0'

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Add()
    while ($wb.Worksheets.Count -gt 1) { $wb.Worksheets.Item($wb.Worksheets.Count).Delete() }
    $ws = $wb.Worksheets.Item(1)
    $ws.Name = 'ESPN Leaders'

    $ws.Range('A1').Resize($n,$m).Value2 = $arr

    $used = $ws.UsedRange
    $hdr = $ws.Range('A1').Resize(1,$m)
    $hdr.Font.Bold = $true
    $hdr.Font.Color = 16777215          # white text
    $hdr.Interior.Color = 12611584       # ESPN blue (BGR)
    $hdr.HorizontalAlignment = -4108     # xlCenter

    $used.Borders.LineStyle = 1
    $used.Borders.Weight = 2
    $used.Borders.Color = 14277081
    $used.Rows.Item(1).RowHeight = 22

    $ws.Activate()
    $excel.ActiveWindow.SplitRow = 1
    $excel.ActiveWindow.FreezePanes = $true

    $used.Columns.AutoFit() | Out-Null
    $ws.Range('H2').Resize($rows.Count,1).NumberFormat = $projFormat
    $ws.ListObjects.Add(1, $used, $null, 1).Name = 'Leaders'   # autofilter

    $dir = Split-Path -Path $OutPath -Parent
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    if (Test-Path $OutPath) { Remove-Item $OutPath -Force }

    $wb.SaveAs($OutPath, 51)             # 51 = xlOpenXMLWorkbook (.xlsx)
    $wb.Close($false)
    Write-Output "saved $OutPath ($($rows.Count) data rows)"
}
finally {
    $excel.Quit()
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
}
