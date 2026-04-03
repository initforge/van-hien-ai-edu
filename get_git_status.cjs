const { execSync } = require('child_process');
const fs = require('fs');
try {
    const status = execSync('git status --porcelain').toString();
    const formatted = status.split('\n')
        .filter(Boolean)
        .filter(line => !line.includes('node_modules'))
        .filter(line => !line.includes('dist/'))
        .filter(line => !line.includes('.git-status'))
        .filter(line => !line.includes('get_git_status.cjs'));
    
    fs.writeFileSync('git_status_filtered.json', JSON.stringify(formatted, null, 2));
} catch (e) {
    fs.writeFileSync('git_status_filtered.json', JSON.stringify({error: e.toString()}));
}
