use std::env;
use std::fs;
use std::path::Path;
use std::process::Command;
use chrono::NaiveDateTime;

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() != 3 {
        eprintln!("Usage: {} <image_path> <date_source>", args[0]);
        eprintln!("Date source can be:");
        eprintln!("  - A datetime string: \"2024-01-15 14:30:00\"");
        eprintln!("  - 'filename' to extract from filename (yyyymm format)");
        eprintln!("  - 'modified' to use file modified date");
        eprintln!("  - 'created' to use file created date");
        std::process::exit(1);
    }

    let file_path = &args[1];
    let date_source = &args[2];

    match update_exif_date(file_path, date_source) {
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

fn update_exif_date(file_path: &str, date_source: &str) -> Result<(), Box<dyn std::error::Error>> {
    let path = Path::new(file_path);

    if !path.exists() {
        return Err(format!("File not found: {}", file_path).into());
    }

    let dt = match date_source {
        "filename" => extract_date_from_filename(path)?,
        "modified" => extract_date_from_modified(path)?,
        "created" => extract_date_from_created(path)?,
        _ => NaiveDateTime::parse_from_str(date_source, "%Y-%m-%d %H:%M:%S")
            .map_err(|_| format!("Invalid datetime format. Expected format: YYYY-MM-DD HH:MM:SS or 'filename'/'modified'/'created'"))?
    };

    let absolute_path = fs::canonicalize(file_path)
        .map_err(|e| format!("Failed to resolve path: {}", e))?;

    let path_str = absolute_path.to_str()
        .ok_or("Invalid file path encoding")?;

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

fn extract_date_from_filename(path: &Path) -> Result<NaiveDateTime, Box<dyn std::error::Error>> {
    let filename = path.file_name()
        .ok_or("Invalid filename")?
        .to_str()
        .ok_or("Invalid filename encoding")?;

    let re = regex::Regex::new(r"^(\d{6})").unwrap();

    if let Some(caps) = re.captures(filename) {
        let yyyymm = &caps[1];
        let year: i32 = yyyymm[0..4].parse()
            .map_err(|_| "Invalid year in filename")?;
        let month: u32 = yyyymm[4..6].parse()
            .map_err(|_| "Invalid month in filename")?;

        if year < 1900 || year > 2100 || month < 1 || month > 12 {
            return Err("Invalid date in filename (year must be 1900-2100, month 1-12)".into());
        }

        let date_str = format!("{}-{:02}-01 00:00:00", year, month);
        return NaiveDateTime::parse_from_str(&date_str, "%Y-%m-%d %H:%M:%S")
            .map_err(|e| format!("Failed to parse extracted date: {}", e).into());
    }

    Err("Filename does not start with YYYYMM format".into())
}

fn extract_date_from_modified(path: &Path) -> Result<NaiveDateTime, Box<dyn std::error::Error>> {
    let metadata = fs::metadata(path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;

    let modified = metadata.modified()
        .map_err(|e| format!("Failed to read modified time: {}", e))?;

    let datetime: chrono::DateTime<chrono::Local> = modified.into();
    Ok(datetime.naive_local())
}

fn extract_date_from_created(path: &Path) -> Result<NaiveDateTime, Box<dyn std::error::Error>> {
    let metadata = fs::metadata(path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;

    let created = metadata.created()
        .map_err(|e| format!("Failed to read created time: {}", e))?;

    let datetime: chrono::DateTime<chrono::Local> = created.into();
    Ok(datetime.naive_local())
}
