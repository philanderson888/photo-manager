# Rust EXIF Updater Implementation Guide

## Overview

Your photo manager now includes a Rust-powered EXIF updater! This document explains what was built, how it works, and how to get started.

## What Was Built

### 1. Rust CLI Tool (`/rust`)
A command-line tool written in Rust that updates EXIF DateTimeOriginal metadata in photos.

**Key Files:**
- `rust/Cargo.toml` - Rust project configuration and dependencies
- `rust/src/main.rs` - Main Rust source code
- `rust/README.md` - Detailed Rust project documentation

**What You're Learning:**
- CLI argument parsing
- Error handling with Result types
- Date/time parsing with chrono
- File system operations
- Process spawning (calling PowerShell)
- Cross-platform code with cfg! macros

### 2. Electron Integration
The Rust binary is integrated with your Electron app via Node.js IPC.

**Changes Made:**
- `main.js` - Added IPC handler `update-exif-rust` that spawns the Rust binary
- `renderer.js` - Added UI logic to call the Rust handler
- `index.html` - Added date picker and update button
- `styles.css` - Added styling for the update interface

## How It Works

```
User Interface (Electron)
    ↓
IPC Call (update-exif-rust)
    ↓
Node.js spawns Rust binary
    ↓
Rust validates input
    ↓
Rust calls PowerShell/.NET
    ↓
PowerShell updates EXIF data
    ↓
Success/Error returned to UI
```

## Getting Started

### Step 1: Install Rust

1. Visit [https://rustup.rs/](https://rustup.rs/)
2. Download and run the installer
3. Follow the installation prompts
4. Restart your terminal
5. Verify installation: `rustc --version`

### Step 2: Build the Rust Binary

```bash
cd rust
cargo build --release
```

This will:
- Download dependencies (chrono)
- Compile the Rust code
- Create an optimized binary at `rust/target/release/exif-updater.exe`

**First build takes 2-5 minutes**. Subsequent builds are much faster!

### Step 3: Test the Rust CLI (Optional)

```bash
# Test the binary directly
cd rust/target/release
./exif-updater.exe "C:\path\to\photo.jpg" "2024-01-15 14:30:00"
```

### Step 4: Run Your Electron App

```bash
npm start
```

The app will now use your Rust binary to update EXIF data!

## Using the EXIF Updater

1. **Select a folder** with photos
2. **Click any photo** to open the detail panel
3. **Scroll to "Update Date Taken (Rust)"** section
4. **Pick a new date/time** using the date picker
5. **Click "Update EXIF"** button
6. **Watch the Rust magic happen!**

The UI will show:
- Loading state while processing
- Success message when complete
- Error details if something goes wrong

## Rust Learning Path

### What You've Built (Beginner)
- ✅ CLI tool with argument parsing
- ✅ Error handling with Result types
- ✅ Date/time manipulation
- ✅ Process spawning
- ✅ Cross-platform checks

### Next Steps (Intermediate)
- [ ] Add batch processing (multiple files)
- [ ] Read EXIF data in pure Rust
- [ ] Add configuration file support
- [ ] Implement logging

### Advanced Challenges
- [ ] Write EXIF data in pure Rust (no PowerShell)
- [ ] Cross-platform support (macOS/Linux)
- [ ] Async processing with Tokio
- [ ] Build a GUI with egui or iced

## Technical Architecture

### Why This Approach?

**Rust for:**
- Validation and safety
- CLI interface
- Error handling
- Cross-platform detection

**PowerShell/.NET for:**
- Actual EXIF writing
- Windows system integration
- Reliability

This hybrid approach gives you:
1. **Learning value** - Real Rust skills
2. **Reliability** - Proven EXIF writing
3. **Performance** - Fast startup, no overhead
4. **Maintainability** - Clear separation of concerns

### Future: Pure Rust EXIF Writing

For a pure Rust solution, you'd need to:
1. Parse JPEG file structure
2. Locate APP1 (EXIF) segment
3. Parse EXIF tags using TIFF format
4. Update DateTimeOriginal (tag 36867)
5. Recalculate segment lengths
6. Reconstruct JPEG file

This is a great learning project but complex. Libraries like `kamadak-exif` can read EXIF, but writing requires manual JPEG manipulation.

## Troubleshooting

### "cargo: command not found"
- Rust not installed or not in PATH
- Restart terminal after installing Rust
- Run: `rustup default stable`

### "Failed to start Rust process"
- Binary not built yet
- Run: `cd rust && cargo build --release`

### "PowerShell error"
- Windows-only limitation
- For macOS/Linux, you'll need exiftool integration

### EXIF not updating
- Check file permissions
- Ensure file is a valid JPEG with existing EXIF data
- Check error message in UI

## Next Learning Projects

1. **CLI Tool Enhancement**
   - Add more EXIF fields
   - Support batch operations
   - Add progress bars

2. **Web Server**
   - Build REST API with actix-web
   - Handle file uploads
   - Return JSON responses

3. **Game Development**
   - Try Bevy game engine
   - Learn ECS architecture
   - Build 2D/3D games

4. **WebAssembly**
   - Compile Rust to WASM
   - Run in browser
   - Build web tools

5. **Systems Programming**
   - File system utilities
   - Network tools
   - OS integration

## Resources

- [The Rust Book](https://doc.rust-lang.org/book/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
- [Exercism Rust Track](https://exercism.org/tracks/rust)
- [r/rust Community](https://www.reddit.com/r/rust/)

## Congratulations!

You've built your first Rust application integrated with a real-world project. You've learned:
- Project structure
- Dependencies with Cargo
- Error handling
- System integration
- Cross-language communication

This is just the beginning of your Rust journey! Keep building, keep learning, and welcome to the Rust community! 🦀
