# Quick Start Guide

## Your Rust-Powered Photo Manager

### Step-by-Step Setup (10 minutes)

#### 1. Install Rust (5 min)
- [ ] Visit: https://rustup.rs/
- [ ] Download and run installer
- [ ] Restart your terminal
- [ ] Verify: `rustc --version`

#### 2. Build Rust Binary (3 min)
**Option A - Easy (Windows):**
```bash
build-rust.bat
```

**Option B - Manual:**
```bash
cd rust
cargo build --release
cd ..
```

#### 3. Run the App (1 min)
```bash
npm start
```

### Using the EXIF Updater

1. Click **"Select Folder"** and choose a folder with photos
2. Click any photo thumbnail
3. Scroll down to **"Update Date Taken (Rust)"**
4. Pick a new date and time
5. Click **"Update EXIF"**
6. Watch Rust work its magic!

### What You're Learning

This project teaches you:
- ✅ Rust CLI development
- ✅ Error handling (Result types)
- ✅ Date/time parsing
- ✅ Process spawning
- ✅ Node.js/Rust integration
- ✅ Real-world problem solving

### Troubleshooting

**"cargo: command not found"**
→ Rust not installed. Go to https://rustup.rs/

**"Failed to start Rust process"**
→ Binary not built. Run `build-rust.bat`

**EXIF not updating**
→ Check Windows. macOS/Linux need exiftool integration

### Next Steps

1. Read: `docs/rust-exif-implementation.md` (full guide)
2. Explore: `rust/src/main.rs` (understand the code)
3. Enhance: Add batch processing or more EXIF fields
4. Learn: The Rust Book (https://doc.rust-lang.org/book/)

### Resources

- **Rust Project**: `rust/README.md`
- **Full Guide**: `docs/rust-exif-implementation.md`
- **Main README**: `README.md`

Welcome to Rust! 🦀
