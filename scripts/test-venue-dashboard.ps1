param(
  [string]$BaseUrl = "http://localhost:3000/api",
  [string]$Token = "demo-token"
)

$headers = @{
  "Authorization" = "Bearer $Token"
  "Content-Type"  = "application/json"
}

Write-Host "Create gig"
$createBody = @{
  title     = "Demo gig"
  payAmount = 120
  currency  = "EUR"
  startTime = "2026-03-01T00:00:00.000Z"
  endTime   = "2026-03-01T23:59:00.000Z"
} | ConvertTo-Json

$created = Invoke-RestMethod -Method Post -Uri "$BaseUrl/venue/gigs" -Headers $headers -Body $createBody
$created | ConvertTo-Json

Write-Host "List gigs"
$gigs = Invoke-RestMethod -Method Get -Uri "$BaseUrl/venue/gigs" -Headers $headers
$gigs | ConvertTo-Json

if ($gigs.Count -gt 0) {
  $id = $gigs[0].id

  Write-Host "Patch gig"
  $patchBody = @{
    title  = "Demo gig updated"
    status = "published"
  } | ConvertTo-Json
  $patched = Invoke-RestMethod -Method Patch -Uri "$BaseUrl/venue/gigs/$id" -Headers $headers -Body $patchBody
  $patched | ConvertTo-Json

  Write-Host "List applications"
  $apps = Invoke-RestMethod -Method Get -Uri "$BaseUrl/venue/gigs/$id/applications" -Headers $headers
  $apps | ConvertTo-Json

  Write-Host "History"
  $history = Invoke-RestMethod -Method Get -Uri "$BaseUrl/venue/history" -Headers $headers
  $history | ConvertTo-Json

  Write-Host "Delete gig"
  $deleted = Invoke-RestMethod -Method Delete -Uri "$BaseUrl/venue/gigs/$id" -Headers $headers
  $deleted | ConvertTo-Json
}
