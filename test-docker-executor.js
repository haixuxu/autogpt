/**
 * Simple test script for Docker Executor
 * Run with: node test-docker-executor.js
 */

const { DockerExecutor, DEFAULT_SANDBOX_POLICY } = require('./dist/index.cjs');

async function testDockerExecutor() {
  console.log('🐳 Testing Docker Executor...\n');

  try {
    // Create Docker executor
    console.log('Creating Docker executor...');
    const executor = new DockerExecutor(DEFAULT_SANDBOX_POLICY);
    console.log('✓ Docker executor created successfully\n');

    // Test 1: Python execution
    console.log('Test 1: Python Hello World');
    const pythonResult = await executor.execute({
      language: 'python',
      code: 'print("Hello from Python in Docker!")\nprint(2 + 2)',
    });
    console.log('  stdout:', pythonResult.stdout);
    console.log('  stderr:', pythonResult.stderr);
    console.log('  exitCode:', pythonResult.exitCode);
    console.log('  duration:', pythonResult.durationMs, 'ms');
    console.log('  ✓ Python test', pythonResult.exitCode === 0 ? 'PASSED' : 'FAILED');
    console.log();

    // Test 2: JavaScript execution
    console.log('Test 2: JavaScript Hello World');
    const jsResult = await executor.execute({
      language: 'javascript',
      code: 'console.log("Hello from Node.js in Docker!");\nconsole.log(2 + 2);',
    });
    console.log('  stdout:', jsResult.stdout);
    console.log('  stderr:', jsResult.stderr);
    console.log('  exitCode:', jsResult.exitCode);
    console.log('  duration:', jsResult.durationMs, 'ms');
    console.log('  ✓ JavaScript test', jsResult.exitCode === 0 ? 'PASSED' : 'FAILED');
    console.log();

    // Test 3: Bash execution
    console.log('Test 3: Bash Script');
    const bashResult = await executor.execute({
      language: 'bash',
      code: 'echo "Hello from Bash in Docker!"\necho "Current directory: $(pwd)"',
    });
    console.log('  stdout:', bashResult.stdout);
    console.log('  stderr:', bashResult.stderr);
    console.log('  exitCode:', bashResult.exitCode);
    console.log('  duration:', bashResult.durationMs, 'ms');
    console.log('  ✓ Bash test', bashResult.exitCode === 0 ? 'PASSED' : 'FAILED');
    console.log();

    console.log('🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nNote: Make sure Docker is installed and running:');
    console.error('  - Check with: docker ps');
    console.error('  - Start with: sudo systemctl start docker (Linux)');
    console.error('  - Or start Docker Desktop (Mac/Windows)');
    process.exit(1);
  }
}

testDockerExecutor();

