# EXIF Updater - Rust CLI Tool

A Rust command-line tool for updating EXIF DateTimeOriginal metadata in photo files.

## Prerequisites

- [Rust](https://rustup.rs/) installed on your system
- Windows OS (current version uses PowerShell)

## Building

```bash
cd rust
cargo build --release
```

The compiled binary will be at: `target/release/exif-updater.exe`

## Usage

```bash
exif-updater <image_path> <datetime>
```

### Example

```bash
exif-updater photo.jpg "2024-01-15 14:30:00"
```

## What You're Learning

This Rust project teaches fundamental concepts:

1. **CLI Argument Parsing** - Reading command-line arguments
2. **Error Handling** - Using Result types and the `?` operator
3. **Date/Time Parsing** - Working with chrono crate
4. **File System Operations** - Path validation and canonicalization
5. **Process Spawning** - Calling external commands (PowerShell)
6. **String Formatting** - Building command strings safely
7. **Cross-Platform Checks** - Using cfg! macro for OS detection

## Architecture

This tool uses a pragmatic approach:
- Parses and validates input in Rust (teaches error handling)
- Delegates EXIF writing to PowerShell/.NET (works reliably)
- Shows real-world pattern: Rust for safety, system tools for implementation

## Future Enhancements

- Pure Rust EXIF writing (complex but educational)
- Cross-platform support (macOS, Linux with exiftool)
- Batch processing support
- Configuration file support
