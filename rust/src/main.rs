use std::env;
use std::fs;
use std::path::Path;
use std::process::Command;
use chrono::NaiveDateTime;

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() != 3 {
        eprintln!("Usage: {} <image_path> <datetime>", args[0]);
        eprintln!("Example: {} photo.jpg \"2024-01-15 14:30:00\"", args[0]);
        std::process::exit(1);
    }

    let file_path = &args[1];
    let datetime_str = &args[2];

    match update_exif_date(file_path, datetime_str) {
        Ok(_) => {
            println!("Successfully updated EXIF date for: {}", file_path);
            std::process::exit(0);
        }
        Err(e) => {
            eprintln!("Error: {}", e);
            std::process::exit(1);
        }
    }
}

fn update_exif_date(file_path: &str, datetime_str: &str) -> Result<(), Box<dyn std::error::Error>> {
    // Validate the file exists
    if !Path::new(file_path).exists() {
        return Err(format!("File not found: {}", file_path).into());
    }

    // Parse and validate the datetime string
    let dt = NaiveDateTime::parse_from_str(datetime_str, "%Y-%m-%d %H:%M:%S")
        .map_err(|e| format!("Invalid datetime format '{}'. Expected format: YYYY-MM-DD HH:MM:SS", e))?;

    // Convert to Windows file time format (for PowerShell)
    let file_time_str = dt.format("%m/%d/%Y %I:%M:%S %p").to_string();

    // Get absolute path
    let absolute_path = fs::canonicalize(file_path)
        .map_err(|e| format!("Failed to resolve path: {}", e))?;

    let path_str = absolute_path.to_str()
        .ok_or("Invalid file path encoding")?;

    // Create PowerShell script to update EXIF
    let ps_script = format!(
        r#"
        Add-Type -AssemblyName System.Drawing
        $img = [System.Drawing.Image]::FromFile('{}')
        $propItem = $img.GetPropertyItem(36867)
        $dateStr = '{}'
        $dateBytes = [System.Text.Encoding]::ASCII.GetBytes($dateStr + [char]0)
        $propItem.Value = $dateBytes
        $propItem.Len = $dateBytes.Length
        $img.SetPropertyItem($propItem)
        $img.Save('{}' + '.tmp')
        $img.Dispose()
        Move-Item -Path ('{}' + '.tmp') -Destination '{}' -Force
        "#,
        path_str,
        dt.format("%Y:%m:%d %H:%M:%S"),
        path_str,
        path_str,
        path_str
    );

    // Execute PowerShell command
    let output = if cfg!(target_os = "windows") {
        Command::new("powershell")
            .args(&["-NoProfile", "-Command", &ps_script])
            .output()
            .map_err(|e| format!("Failed to execute PowerShell: {}", e))?
    } else {
        return Err("This tool currently only supports Windows. For other platforms, install exiftool.".into());
    };

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("PowerShell error: {}", stderr).into());
    }

    Ok(())
}
