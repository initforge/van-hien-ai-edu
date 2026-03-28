import { execSync } from "child_process";
import path from "path";

// Execute query on Production D1 Database
export function executeD1Query(query: string) {
  try {
    const projectRoot = process.cwd();
    // Run wrangler d1 execute on the vanhien-db (Production)
    const stdout = execSync(
      `npx wrangler d1 execute vanhien-db --remote --json --command="${query}"`,
      { cwd: projectRoot, encoding: "utf-8" }
    );
    
    // Parse the JSON output from wrangler
    try {
      const parsed = JSON.parse(stdout);
      // The output is an array of results. We usually care about the first one.
      return parsed[0]?.results || [];
    } catch (parseError) {
      console.warn("Could not parse D1 JSON output, returning raw stdout", stdout);
      return stdout;
    }
  } catch (err: any) {
    console.error("D1 Query Error:", err.message);
    if (err.stdout) console.error("Stdout:", err.stdout);
    if (err.stderr) console.error("Stderr:", err.stderr);
    throw err;
  }
}

export function cleanupTestData(testId: string) {
  // Common automated teardown by specific test markers
  const commands = [
    `DELETE FROM works WHERE author LIKE '%${testId}%' OR title LIKE '%${testId}%';`,
    `DELETE FROM exams WHERE title LIKE '%${testId}%';`,
    `DELETE FROM questions WHERE content LIKE '%${testId}%';`,
  ];
  
  for (const cmd of commands) {
    executeD1Query(cmd);
  }
}
