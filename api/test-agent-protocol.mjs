#!/usr/bin/env node

/**
 * Agent Protocol API Test Script
 * Tests the new Steps and Artifacts API endpoints
 */

const API_BASE = process.env.API_URL || 'http://localhost:3001';

async function request(method, path, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json();

  return { status: response.status, data };
}

async function testAgentProtocol() {
  console.log('🧪 Testing Agent Protocol API Endpoints\n');

  try {
    // 1. Create a task
    console.log('1️⃣  Creating a new task...');
    const createTaskRes = await request('POST', '/api/tasks', {
      task: 'Test task for Agent Protocol validation',
      workspace: './test-workspace',
    });

    if (createTaskRes.status !== 200) {
      console.error('❌ Failed to create task:', createTaskRes.data);
      return;
    }

    const taskId = createTaskRes.data.agent?.id;
    if (!taskId) {
      console.error('❌ No task ID returned');
      return;
    }
    console.log(`✅ Task created: ${taskId}\n`);

    // 2. List tasks with pagination
    console.log('2️⃣  Listing tasks (with pagination)...');
    const listTasksRes = await request('GET', '/api/tasks?page=1&pageSize=10');
    if (listTasksRes.status === 200) {
      const taskCount = listTasksRes.data.tasks?.length || 0;
      const pagination = listTasksRes.data.pagination;
      console.log(`✅ Found ${taskCount} tasks`);
      console.log(`   Pagination: page ${pagination?.page}/${pagination?.totalPages}, total ${pagination?.total}\n`);
    } else {
      console.log(`⚠️  Tasks list failed: ${listTasksRes.status}\n`);
    }

    // 3. Create a step
    console.log('3️⃣  Creating a step...');
    const createStepRes = await request('POST', `/api/tasks/${taskId}/steps`, {
      name: 'Test Step 1',
      input: { action: 'read_file', path: 'test.txt' },
      additional_input: { context: 'Testing step creation' },
    });

    if (createStepRes.status !== 201) {
      console.log(`⚠️  Step creation returned status ${createStepRes.status}`);
      console.log(`   Response: ${JSON.stringify(createStepRes.data, null, 2)}\n`);
    } else {
      const stepId = createStepRes.data.step_id;
      console.log(`✅ Step created: ${stepId}\n`);

      // 4. Update step to running
      console.log('4️⃣  Updating step status to running...');
      const updateStepRes = await request('PATCH', `/api/tasks/${taskId}/steps/${stepId}`, {
        status: 'running',
      });

      if (updateStepRes.status === 200) {
        console.log(`✅ Step status updated: ${updateStepRes.data.status}\n`);
      } else {
        console.log(`⚠️  Step update failed: ${updateStepRes.status}\n`);
      }

      // 5. List steps
      console.log('5️⃣  Listing steps for task...');
      const listStepsRes = await request('GET', `/api/tasks/${taskId}/steps?page=1&pageSize=20`);
      if (listStepsRes.status === 200) {
        const stepCount = listStepsRes.data.steps?.length || 0;
        console.log(`✅ Found ${stepCount} step(s) for task\n`);
      } else {
        console.log(`⚠️  Steps list failed: ${listStepsRes.status}\n`);
      }

      // 6. Complete step
      console.log('6️⃣  Completing step...');
      const completeStepRes = await request('PATCH', `/api/tasks/${taskId}/steps/${stepId}`, {
        status: 'completed',
        output: { result: 'File read successfully', content: 'Test content' },
        is_last: true,
      });

      if (completeStepRes.status === 200) {
        console.log(`✅ Step completed\n`);
      } else {
        console.log(`⚠️  Step completion failed: ${completeStepRes.status}\n`);
      }

      // 7. Get step details
      console.log('7️⃣  Getting step details...');
      const getStepRes = await request('GET', `/api/tasks/${taskId}/steps/${stepId}`);
      if (getStepRes.status === 200) {
        console.log(`✅ Step details retrieved`);
        console.log(`   Status: ${getStepRes.data.status}`);
        console.log(`   Is Last: ${getStepRes.data.is_last}\n`);
      } else {
        console.log(`⚠️  Get step failed: ${getStepRes.status}\n`);
      }
    }

    // 8. Test task control endpoints
    console.log('8️⃣  Testing task control (pause)...');
    const pauseRes = await request('POST', `/api/tasks/${taskId}/pause`);
    if (pauseRes.status === 200) {
      console.log(`✅ Task paused: ${pauseRes.data.status}\n`);
    } else {
      console.log(`⚠️  Pause failed: ${pauseRes.status}\n`);
    }

    console.log('9️⃣  Testing task control (resume)...');
    const resumeRes = await request('POST', `/api/tasks/${taskId}/resume`);
    if (resumeRes.status === 200) {
      console.log(`✅ Task resumed: ${resumeRes.data.status}\n`);
    } else {
      console.log(`⚠️  Resume failed: ${resumeRes.status}\n`);
    }

    // 9. Get task with Agent Protocol format
    console.log('🔟 Getting task (Agent Protocol format)...');
    const getTaskRes = await request('GET', `/api/tasks/${taskId}`);
    if (getTaskRes.status === 200) {
      console.log(`✅ Task retrieved (legacy format still supported)\n`);
    } else {
      console.log(`⚠️  Get task failed: ${getTaskRes.status}\n`);
    }

    // 10. Clean up
    console.log('🧹 Cleaning up...');
    const deleteRes = await request('DELETE', `/api/tasks/${taskId}`);
    if (deleteRes.status === 204) {
      console.log(`✅ Task deleted\n`);
    } else {
      console.log(`⚠️  Delete failed: ${deleteRes.status}\n`);
    }

    console.log('✅ All Agent Protocol tests completed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testAgentProtocol().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

