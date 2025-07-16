# Terminal Command Guidelines for macOS

## File Path Handling

- Use single quotes for file paths with spaces: `'file name'` not `"file name"`
- Prefer relative paths when working within the project directory
- Use tab completion to avoid typing errors in file paths
- Escape special characters with backslash when not using quotes

## Command Execution Best Practices

### Process Management
- Use `&&` to chain commands that should only run if the previous succeeds
- Use `||` for fallback commands
- Use `;` to run commands sequentially regardless of success/failure
- Use `&` to run commands in background (sparingly in development)

### File Operations
- Always use `ls -la` for detailed directory listings
- Use `mkdir -p` to create nested directories safely
- Use `cp -r` for recursive directory copying
- Use `rm -rf` with extreme caution - prefer moving to trash first

### Development Workflow
- Use `npm run` commands instead of direct node/npx when available
- Check `package.json` scripts before running manual commands
- Use `git status` frequently to understand repository state
- Prefer `git add .` over `git add *` for staging changes

### Environment & Navigation
- Use `pwd` to confirm current directory before destructive operations
- Use `which command` to verify command availability
- Check environment variables with `echo $VARIABLE_NAME`
- Use `history | grep pattern` to find previously used commands

### macOS Specific
- Use `open .` to open current directory in Finder
- Use `open file.txt` to open files with default applications
- Use `pbcopy` and `pbpaste` for clipboard operations
- Use `say "message"` for audio feedback on long-running operations

### Safety Guidelines
- Always confirm destructive operations before execution
- Use `--dry-run` flags when available for preview
- Create backups before major file operations
- Test commands in development environment first

### Common Project Commands
```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run lint            # Run linting
npm run test            # Run tests

# Git workflow
git status              # Check repository status
git add .               # Stage all changes
git commit -m "message" # Commit with message
git push                # Push to remote

# File operations
ls -la                  # List files with details
mkdir -p path/to/dir    # Create nested directories
cp -r source dest       # Copy directories recursively
```

### Error Handling
- Read error messages completely before asking for help
- Use `man command` to understand command options
- Check exit codes with `echo $?` after command execution
- Use `command 2>&1 | tee log.txt` to capture output and errors