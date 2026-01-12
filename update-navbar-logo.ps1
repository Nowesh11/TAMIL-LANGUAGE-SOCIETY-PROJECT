# PowerShell script to update navbar logo
$BASE_URL = "http://localhost:3000"
$ADMIN_EMAIL = "admin@tamilsociety.org"
$ADMIN_PASSWORD = "admin123"
$NAVBAR_COMPONENT_ID = "69004c114f9b43805e93bdbe"
$NEW_LOGO_PATH = "uploads/components/69004c114f9b43805e93bdc2/TLS_CL_1 (1)_1761803607457_tsnfoa.png"

Write-Host "🔄 Updating navbar logo..." -ForegroundColor Yellow

try {
    # Step 1: Login as admin
    Write-Host "1. Logging in as admin..." -ForegroundColor Cyan
    $loginBody = @{
        email = $ADMIN_EMAIL
        password = $ADMIN_PASSWORD
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri "$BASE_URL/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    
    if ($loginResponse.StatusCode -eq 200) {
        $loginData = $loginResponse.Content | ConvertFrom-Json
        Write-Host "✅ Login successful" -ForegroundColor Green
        Write-Host "   User: $($loginData.user.name.en) ($($loginData.user.email))" -ForegroundColor Gray
        
        $accessToken = $loginData.accessToken
        
        # Step 2: Update the navbar component
        Write-Host "`n2. Updating navbar component logo..." -ForegroundColor Cyan
        $updateBody = @{
            content = @{
                logo = @{
                    image = @{
                        src = $NEW_LOGO_PATH
                        alt = @{
                            en = "Tamil Language Society"
                            ta = "தமிழ் மொழி சங்கம்"
                        }
                    }
                    text = @{
                        en = "Tamil Language Society"
                        ta = "தமிழ் மொழி சங்கம்"
                    }
                }
            }
        } | ConvertTo-Json -Depth 10

        $headers = @{
            "Authorization" = "Bearer $accessToken"
            "Content-Type" = "application/json"
        }

        $updateResponse = Invoke-WebRequest -Uri "$BASE_URL/api/admin/components/$NAVBAR_COMPONENT_ID" -Method PATCH -Body $updateBody -Headers $headers
        
        if ($updateResponse.StatusCode -eq 200) {
            $updateData = $updateResponse.Content | ConvertFrom-Json
            Write-Host "✅ Navbar logo updated successfully!" -ForegroundColor Green
            Write-Host "   Component ID: $($updateData.data._id)" -ForegroundColor Gray
            Write-Host "   New logo path: $NEW_LOGO_PATH" -ForegroundColor Gray
            
            # Step 3: Verify the update
            Write-Host "`n3. Verifying the update..." -ForegroundColor Cyan
            $verifyResponse = Invoke-WebRequest -Uri "$BASE_URL/api/components/page?page=home" -Method GET
            
            if ($verifyResponse.StatusCode -eq 200) {
                $verifyData = $verifyResponse.Content | ConvertFrom-Json
                $navbar = $verifyData.components | Where-Object { $_.type -eq "navbar" }
                
                if ($navbar -and $navbar.content.logo.image.src -eq $NEW_LOGO_PATH) {
                    Write-Host "✅ Logo update verified successfully!" -ForegroundColor Green
                    Write-Host "   Current logo path: $($navbar.content.logo.image.src)" -ForegroundColor Gray
                } else {
                    Write-Host "⚠️ Logo update verification failed" -ForegroundColor Yellow
                    Write-Host "   Expected: $NEW_LOGO_PATH" -ForegroundColor Gray
                    Write-Host "   Actual: $($navbar.content.logo.image.src)" -ForegroundColor Gray
                }
            }
        } else {
            Write-Host "❌ Update failed: $($updateResponse.StatusCode)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Login failed: $($loginResponse.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error updating navbar logo: $($_.Exception.Message)" -ForegroundColor Red
}