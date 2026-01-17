# Source - https://stackoverflow.com/a
# Posted by Emperor XLII, modified by community. See post 'Timeline' for change history
# Retrieved 2026-01-17, License - CC BY-SA 3.0

$file = Get-Item .\202412-hannah-birthday.png
$shellObject = New-Object -ComObject Shell.Application
$directoryObject = $shellObject.NameSpace( $file.Directory.FullName )
$fileObject = $directoryObject.ParseName( $file.Name )

$property = 'Date taken'
for(
  $index = 5;
  $directoryObject.GetDetailsOf( $directoryObject.Items, $index ) -ne $property;
  ++$index ) { }

$value = $directoryObject.GetDetailsOf( $fileObject, $index )

write-output $value
Write-Output $value
Write-Host "Date taken: $value"
# Out-Host "Date taken: $value"