# Update Date Taken Feature - Analysis & Planning

## Purpose
Enable users to correct photo metadata by updating the "Date Taken" field to match one of three sources:
1. File name (YYYYMM prefix)
2. File modified date
3. File created date

## Background & Context

### The Problem
- Photo metadata (date taken) is often corrupted when moving files between systems (e.g., iCloud → OneDrive)
- Manual file naming with YYYYMM prefix is the most reliable source of truth
- Users need an easy way to restore correct metadata from reliable sources

### Current Behavior
- App displays date taken in red when it doesn't match the YYYYMM in the filename
- No way to fix the mismatch currently

## Feature Requirements

### Functional Requirements

1. **Show action buttons only when there's a mismatch**
   - Buttons appear in rows with red-highlighted date taken
   - Keep UI clean when dates match

2. **Three update options:**
   - **From Filename**: Extract YYYYMM, set day to 01, time to 00:00
   - **From Modified**: Use file's modified date/time
   - **From Created**: Use file's created date/time

3. **Button Design**
   - Small, subtle, not intrusive
   - Icons or short labels
   - Hover text explains the action
   - Visually distinct from each other

### UI/UX Design

#### Button Placement
- In the row with the mismatched date
- Probably in a new column or within the date taken cell
- Aligned right or after the date value

#### Button Style Options
1. **Icon-only** (most compact)
   - 📄 (document/filename)
   - ✏️ (modified/edited)
   - ➕ (created/new)

2. **Short text** (clearer)
   - "Name"
   - "Mod"
   - "New"

3. **Hybrid** (balanced)
   - Icon + hover tooltip

#### Hover Text
- "Update to filename date (YYYYMM-01 00:00)"
- "Update to modified date"
- "Update to created date"

### Technical Implementation

#### 1. Extract YYYYMM from Filename
```javascript
function extractYYYYMM(filename) {
  const match = filename.match(/^(\d{6})/);
  if (match) {
    const yyyymm = match[1];
    const year = yyyymm.substring(0, 4);
    const month = yyyymm.substring(4, 6);
    return { year, month };
  }
  return null;
}
```

#### 2. Update EXIF Date Taken
**Challenge**: JavaScript/Electron cannot directly write EXIF data easily
**Options**:
- Use PowerShell script (Windows-specific)
- Use exiftool (cross-platform, needs installation)
- Use Node.js native module (complex)
- Use piexifjs or similar library (limited support)

**Recommended Approach**: PowerShell for Windows
```powershell
# Set-DateTaken.ps1
param($FilePath, $NewDate)
# Use Windows API or .NET to update EXIF
```

#### 3. IPC Communication
```javascript
// In renderer.js
async function updateDateTaken(filePath, source) {
  const result = await window.electron.updateDateTaken(filePath, source);
  // Refresh photo list
}

// In main.js
ipcMain.handle('update-date-taken', async (event, filePath, source) => {
  // Call PowerShell script
  // Return success/failure
});
```

#### 4. UI Update Flow
1. User clicks button
2. Show loading indicator
3. Call IPC to update metadata
4. Refresh that photo's data
5. Remove red highlight if fixed
6. Show success/error message

### File Structure Changes

#### New Files
- `/powershell/set-date-taken.ps1` - Update EXIF date taken
- `/docs/update-date-taken.md` - This document

#### Modified Files
- `renderer.js` - Add button click handlers, UI updates
- `main.js` - Add IPC handler for update operation
- `styles.css` - Button styles
- `index.html` - May need structure changes for buttons

### Implementation Steps

1. **Phase 1: PowerShell Script**
   - Create script to update EXIF date taken
   - Test with sample files
   - Handle errors gracefully

2. **Phase 2: IPC Setup**
   - Add IPC handler in main.js
   - Add exposed API in preload context
   - Test communication

3. **Phase 3: UI Components**
   - Add button HTML to photo rows
   - Style buttons (small, subtle)
   - Add hover tooltips
   - Show buttons only on mismatched rows

4. **Phase 4: Integration**
   - Wire up click handlers
   - Implement date extraction logic
   - Call IPC and handle response
   - Refresh UI after update
   - Add user feedback (toast/message)

5. **Phase 5: Testing**
   - Test with various filename formats
   - Test with different date mismatches
   - Verify EXIF updates persist
   - Test error cases

### Edge Cases & Considerations

1. **Invalid YYYYMM in filename**
   - What if filename has 202413 (invalid month)?
   - Validate before attempting update

2. **File permissions**
   - What if file is read-only?
   - Show appropriate error message

3. **Multiple photos selected**
   - Future enhancement: batch update
   - For now: one at a time

4. **Undo functionality**
   - Complex to implement
   - Consider for future version
   - For now: user should backup first

5. **Cross-platform support**
   - PowerShell approach is Windows-only
   - macOS/Linux would need different approach (exiftool)
   - Document this limitation

### Success Criteria

- ✅ Buttons appear only on mismatched dates
- ✅ Clicking button updates EXIF successfully
- ✅ UI refreshes to show updated date
- ✅ Red highlight removed when fixed
- ✅ Clear error messages on failure
- ✅ Compact, non-intrusive UI
- ✅ Works reliably on Windows

### Future Enhancements

1. Batch update multiple photos
2. Cross-platform support (exiftool)
3. Undo/redo functionality
4. Custom date picker
5. Preview before update
6. Backup original EXIF data

## Questions to Resolve

1. **Icon vs text buttons?**
   - Recommendation: Small text buttons with icons in tooltips
   - "Name" / "Mod" / "New" with descriptive hover text

2. **Button placement?**
   - Recommendation: Add buttons column after date taken, shown only on red rows

3. **Confirmation dialog?**
   - Recommendation: No dialog for quick workflow, but show clear success/error feedback

4. **What about photos without YYYYMM in filename?**
   - Disable/hide the "Name" button for these files
   - Only show "Mod" and "New" buttons

## Risk Assessment

**Low Risk:**
- UI changes
- Date extraction logic

**Medium Risk:**
- EXIF writing (could corrupt files if not done correctly)
- File permission issues

**Mitigation:**
- Test PowerShell script thoroughly with copies first
- Add error handling at every step
- Consider creating backups before modification
- Start with non-critical test files

## Conclusion

This is a well-scoped feature that addresses a real user need. The implementation is straightforward with the main complexity being the EXIF writing on Windows. We'll start with a Windows-first approach using PowerShell and can expand to cross-platform later if needed.

**Recommendation**: Proceed with implementation following the phased approach outlined above.
