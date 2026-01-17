# .gitignore Contents

Copy the contents below into your `.gitignore` file in the root directory:

```
# Environment variables
.env

# Node.js / Electron
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Electron build outputs
dist/
out/
build/
release-builds/
.cache/

# Rust build artifacts
rust/target/
**/*.rs.bk
*.pdb

# Compiled executables
*.exe
*.dll
*.so
*.dylib

# VS Code
.vscode/
*.code-workspace

# Other editor directories and files
.idea/
*.swp
*.swo
*~
.project
.classpath
.settings/
*.sublime-workspace
*.sublime-project

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
Desktop.ini

# Logs
logs/
*.log
```
