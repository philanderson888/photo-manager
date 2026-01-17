# Rust EXIF Updater - Implementation Plan

## Overview

Build a standalone Rust binary (`photo-exif-updater.exe`) that updates EXIF DateTimeOriginal metadata for photos. This replaces the PowerShell approach with a faster, more reliable, cross-platform solution.

## Why Rust?

- **Reliable**: Strong type system catches errors at compile time
- **Fast**: Native performance, instant execution
- **Cross-platform**: Single codebase compiles for Windows/macOS/Linux
- **Self-contained**: No runtime dependencies (no Python, no .NET)
- **Small**: ~2-3MB binary
- **Safe**: Memory safety prevents crashes and corruption

## Architecture

### Component Design

```
┌─────────────────────┐
│   Electron App      │
│   (JavaScript)      │
└──────────┬──────────┘
           │ spawns process
           │ passes args: file path, new date
           ▼
┌─────────────────────┐
│  Rust Binary        │
│  photo-exif-        │
│  updater.exe        │
│                     │
│  - Parse args       │
│  - Read EXIF        │
│  - Update date      │
│  - Write EXIF       │
│  - Return status    │
└─────────────────────┘
```

### Binary Interface

**Command Line:**
```bash
photo-exif-updater.exe <filepath> <date>
```

**Arguments:**
- `<filepath>`: Full path to photo file
- `<date>`: ISO 8601 format: `YYYY-MM-DD HH:MM:SS` or `YYYY:MM:DD`

**Exit Codes:**
- `0`: Success
- `1`: File not found
- `2`: Invalid date format
- `3`: EXIF read error
- `4`: EXIF write error
- `5`: Invalid arguments

**Output:**
- Success: `OK: Updated <filename> to <date>`
- Error: `ERROR: <description>`

## Rust Dependencies

### Primary Crate: `kamadak-exif`

```toml
[dependencies]
exif = "0.5"  # Reading/writing EXIF data
chrono = "0.4"  # Date/time parsing
```

**Why kamadak-exif?**
- Pure Rust (no C bindings)
- Actively maintained
- Supports read/write for JPEG
- Works with EXIF IFD tags directly

### Alternative: `rexiv2`

If `kamadak-exif` has limitations:
- Wrapper around libexiv2 (C++ library)
- More comprehensive format support
- Requires system libraries (less portable)

**Decision**: Start with `kamadak-exif` for simplicity and portability.

## File Structure

```
project/
├── rust-exif-updater/          # Rust project root
│   ├── Cargo.toml              # Dependencies & build config
│   ├── src/
│   │   ├── main.rs             # Entry point & CLI parsing
│   │   ├── exif_ops.rs         # EXIF read/write logic
│   │   └── date_parser.rs      # Date parsing utilities
│   └── target/
│       └── release/
│           └── photo-exif-updater.exe  # Built binary
│
├── resources/
│   └── bin/
│       └── photo-exif-updater.exe      # Bundled with app
│
└── main.js                     # Updated to call Rust binary
```

## Implementation Phases

### Phase 1: Basic Rust Binary (Core Functionality)

**Files**: `rust-exif-updater/src/main.rs`

**Functionality**:
- Parse command line arguments
- Read EXIF from file
- Update DateTimeOriginal tag
- Write back to file
- Error handling & exit codes

**Testing**:
- Run with test photos
- Verify EXIF updates persist
- Test error cases (missing file, corrupted EXIF)

### Phase 2: Date Parsing & Validation

**Files**: `rust-exif-updater/src/date_parser.rs`

**Functionality**:
- Parse ISO 8601 dates: `2024-01-17 14:30:00`
- Parse date-only: `2024-01-17` (default to 00:00:00)
- Parse YYYYMM from filename: `202401` → `2024-01-01 00:00:00`
- Validate date ranges
- Format for EXIF tag (format: `YYYY:MM:DD HH:MM:SS`)

### Phase 3: Build & Bundling

**Build Commands**:
```bash
cd rust-exif-updater
cargo build --release
```

**Windows Target**:
```bash
cargo build --release --target x86_64-pc-windows-msvc
```

**Copy to resources**:
```bash
cp target/release/photo-exif-updater.exe ../resources/bin/
```

**Electron Integration**:
- Bundle binary in `resources/bin/`
- Use `path.join(__dirname, 'resources/bin/photo-exif-updater.exe')`
- Call via `child_process.spawn()` or `execFile()`

### Phase 4: Electron Integration

**Files**: `main.js`

**Changes**:
1. Remove PowerShell script dependency
2. Add IPC handler: `update-date-taken`
3. Spawn Rust binary with args
4. Capture stdout/stderr
5. Parse exit code
6. Return result to renderer

**Example Code**:
```javascript
const { execFile } = require('child_process');
const path = require('path');

ipcMain.handle('update-date-taken', async (event, filePath, newDate) => {
  const binaryPath = path.join(__dirname, 'resources/bin/photo-exif-updater.exe');

  return new Promise((resolve, reject) => {
    execFile(binaryPath, [filePath, newDate], (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve({ success: true, message: stdout.trim() });
      }
    });
  });
});
```

### Phase 5: Testing & Validation

**Test Cases**:
1. Update date from filename (YYYYMM)
2. Update to modified date
3. Update to created date
4. Invalid file path
5. Invalid date format
6. Read-only file
7. Corrupted EXIF data
8. Non-JPEG file (should fail gracefully)

## EXIF Tag Details

### Target Tag: DateTimeOriginal

**Tag ID**: `0x9003` (ExifIFD)
**Format**: ASCII string `YYYY:MM:DD HH:MM:SS`
**Example**: `2024:01:17 14:30:00`

**Related Tags** (also update for consistency):
- `DateTime` (0x0132): File modification date
- `DateTimeDigitized` (0x9004): Digitization date

**Strategy**: Update all three tags to same value for consistency.

## Error Handling Strategy

### Graceful Failures

1. **File not found**: Clear error message, exit code 1
2. **Permission denied**: Check file permissions, suggest solution
3. **Invalid EXIF**: Report file may be corrupted
4. **Write failure**: File might be open in another app

### Logging

- Write errors to stderr
- Write success to stdout
- Electron captures both and shows to user

## Cross-Platform Considerations

### Windows (Primary Target)

- Compile with MSVC toolchain
- Test on Windows 10/11
- Handle Windows paths correctly

### Future: macOS/Linux

- Compile with GNU toolchain
- Bundle platform-specific binaries
- Electron detects platform and uses correct binary

## Performance Expectations

**Typical Operation**:
- Launch binary: ~10-20ms
- Read EXIF: ~5-10ms
- Write EXIF: ~10-20ms
- **Total**: ~25-50ms per photo

**Comparison**:
- PowerShell: ~200-500ms (startup overhead)
- Rust: ~25-50ms (10x faster)

## Development Workflow

### Prerequisites

```bash
# Install Rust (if not already)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verify installation
rustc --version
cargo --version
```

### Build Process

```bash
# Development (with debug symbols)
cargo build

# Production (optimized)
cargo build --release

# Run tests
cargo test

# Run with args (for testing)
cargo run -- "C:\photos\test.jpg" "2024-01-17 14:30:00"
```

### IDE Setup

- **VS Code**: Install `rust-analyzer` extension
- **IntelliJ**: Use Rust plugin
- Both provide excellent Rust support

## Success Criteria

- ✅ Binary compiles successfully for Windows
- ✅ Updates DateTimeOriginal EXIF tag correctly
- ✅ Handles errors gracefully with clear messages
- ✅ Executes in <50ms per photo
- ✅ Integrates cleanly with Electron app
- ✅ No runtime dependencies required
- ✅ Binary size <5MB
- ✅ All test cases pass

## Future Enhancements

1. **Batch mode**: Update multiple files in one invocation
2. **Format support**: Add PNG, HEIC, RAW formats
3. **Backup mode**: Create backup before modifying
4. **JSON output**: Structured output for programmatic use
5. **Dry-run mode**: Preview changes without writing
6. **Cross-platform builds**: macOS and Linux binaries

## Risk Mitigation

**Low Risk**:
- Rust's safety guarantees prevent memory corruption
- EXIF library is well-tested
- Binary is sandboxed (no system access beyond file)

**Medium Risk**:
- File write operations (could corrupt file if interrupted)

**Mitigation**:
- Write to temporary file first, then rename (atomic operation)
- Validate EXIF structure before writing
- Test extensively with file copies

## Next Steps

1. **Create Rust project**: `cargo new rust-exif-updater`
2. **Add dependencies**: Update `Cargo.toml`
3. **Implement core logic**: Write `main.rs` and modules
4. **Test with sample files**: Verify EXIF updates work
5. **Build release binary**: `cargo build --release`
6. **Integrate with Electron**: Update `main.js` IPC handler
7. **End-to-end testing**: Test full workflow in app

## Conclusion

This Rust-based approach provides a robust, fast, and maintainable solution for EXIF updates. The binary is self-contained, cross-platform ready, and significantly faster than PowerShell. It's an excellent learning project that delivers real value to the application.

**Recommendation**: Proceed with implementation. The path is clear and the benefits are substantial.
