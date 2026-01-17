# Photo Manager with Rust EXIF Updater

A cross-platform photo management application built with Electron and enhanced with Rust for EXIF metadata updates.

## Features

- Browse and view photos from any directory
- Display EXIF metadata (date taken, camera info, dimensions)
- Visual indicators for missing or mismatched dates
- Update EXIF DateTimeOriginal using Rust CLI tool
- Responsive grid layout with detailed photo panel

## Tech Stack

- **Frontend**: Electron, HTML, CSS, JavaScript
- **EXIF Reading**: exifr (JavaScript library)
- **EXIF Writing**: Rust CLI tool (calling PowerShell/.NET)
- **Date Parsing**: chrono (Rust)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Rust

Visit [rustup.rs](https://rustup.rs/) and follow installation instructions.

### 3. Build Rust Binary

```bash
cd rust
cargo build --release
cd ..
```

### 4. Run the App

```bash
npm start
```

## Project Structure

```
project/
├── main.js              # Electron main process
├── renderer.js          # UI logic and photo management
├── index.html           # Main UI
├── styles.css           # Application styles
├── package.json         # Node dependencies
├── rust/                # Rust EXIF updater
│   ├── src/
│   │   └── main.rs      # Rust CLI source
│   ├── Cargo.toml       # Rust dependencies
│   └── README.md        # Rust project docs
├── docs/
│   └── rust-exif-implementation.md  # Comprehensive guide
└── powershell/          # PowerShell utilities
    ├── date-taken.ps1
    └── list-photos.ps1
```

## How EXIF Update Works

1. User selects a photo and picks a new date
2. Electron calls IPC handler `update-exif-rust`
3. Node.js spawns the Rust binary with file path and new date
4. Rust validates input and calls PowerShell/.NET
5. PowerShell updates the EXIF DateTimeOriginal tag
6. Success/error returned to UI
7. Photo list automatically refreshes

## Learning Resources

This project is designed as an entry point into Rust development. See:
- [`rust/README.md`](rust/README.md) - Rust project details
- [`docs/rust-exif-implementation.md`](docs/rust-exif-implementation.md) - Complete guide

## Requirements

- Node.js 14+
- Windows OS (for EXIF writing via PowerShell)
- Rust 1.70+ (for building the EXIF updater)

## Future Enhancements

- [ ] Pure Rust EXIF writing (no PowerShell dependency)
- [ ] Cross-platform support (macOS, Linux)
- [ ] Batch EXIF updates
- [ ] More EXIF fields (title, description, GPS)
- [ ] Photo organization tools

## License

MIT

## Contributing

This is a learning project! Feel free to experiment, break things, and learn Rust along the way.
