const API_BASE = 'https://ykybklpdhd.execute-api.eu-west-3.amazonaws.com/prod';

async function testEndpoint(method, path, body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${path}`, options);
    const data = await response.json();
    return { status: response.status, data };
}

async function runTests() {
    console.log('=== Integration Tests for QuinileaGUE API ===\n');

    let passed = 0;
    let failed = 0;

    // Test 1: Get matches for matchday 1
    console.log('Test 1: GET /matches?matchday=1');
    try {
        const result = await testEndpoint('GET', '/matches?matchday=1');
        if (result.status === 200 && result.data.matches && result.data.matches.length === 10) {
            console.log('  ✅ PASS - Got 10 matches\n');
            passed++;
        } else {
            console.log('  ❌ FAIL - Unexpected response\n');
            failed++;
        }
    } catch (e) {
        console.log(`  ❌ FAIL - ${e.message}\n`);
        failed++;
    }

    // Test 2: Get next matchday
    console.log('Test 2: GET /matches/next');
    try {
        const result = await testEndpoint('GET', '/matches/next');
        if (result.status === 200 && result.data.matchday && result.data.deadline) {
            console.log(`  ✅ PASS - Next matchday: ${result.data.matchday}, Deadline: ${result.data.deadline}\n`);
            passed++;
        } else {
            console.log('  ❌ FAIL - Unexpected response\n');
            failed++;
        }
    } catch (e) {
        console.log(`  ❌ FAIL - ${e.message}\n`);
        failed++;
    }

    // Test 3: Deadline check for past matchday
    console.log('Test 3: POST /bets for past matchday (should fail with deadline)');
    try {
        const result = await testEndpoint('POST', '/bets', {
            matchday: 1,
            userId: 'test-user',
            bets: [{ matchId: 'j1_m1', prediction: '1' }],
        });
        if (result.status === 400 && result.data.error === 'Deadline has passed') {
            console.log('  ✅ PASS - Correctly rejected past matchday\n');
            passed++;
        } else {
            console.log(`  ❌ FAIL - Got status ${result.status}, body: ${JSON.stringify(result.data)}\n`);
            failed++;
        }
    } catch (e) {
        console.log(`  ❌ FAIL - ${e.message}\n`);
        failed++;
    }

    // Test 4: Get bets for matchday 2
    console.log('Test 4: GET /bets?matchday=2');
    try {
        const result = await testEndpoint('GET', '/bets?matchday=2');
        if (result.status === 200 && Array.isArray(result.data.bets)) {
            console.log(`  ✅ PASS - Got ${result.data.bets.length} bets for matchday 2\n`);
            passed++;
        } else {
            console.log('  ❌ FAIL - Unexpected response\n');
            failed++;
        }
    } catch (e) {
        console.log(`  ❌ FAIL - ${e.message}\n`);
        failed++;
    }

    // Test 5: Get standings (empty initially)
    console.log('Test 5: GET /standings');
    try {
        const result = await testEndpoint('GET', '/standings');
        if (result.status === 200 && Array.isArray(result.data.standings)) {
            console.log(`  ✅ PASS - Standings: ${result.data.standings.length} users\n`);
            passed++;
        } else {
            console.log('  ❌ FAIL - Unexpected response\n');
            failed++;
        }
    } catch (e) {
        console.log(`  ❌ FAIL - ${e.message}\n`);
        failed++;
    }

    // Test 6: Get results (empty)
    console.log('Test 6: GET /results');
    try {
        const result = await testEndpoint('GET', '/results');
        if (result.status === 200 && Array.isArray(result.data.results)) {
            console.log(`  ✅ PASS - Results: ${result.data.results.length} matchdays\n`);
            passed++;
        } else {
            console.log('  ❌ FAIL - Unexpected response\n');
            failed++;
        }
    } catch (e) {
        console.log(`  ❌ FAIL - ${e.message}\n`);
        failed++;
    }

    // Test 7: Create bet for future matchday (matchday 2 deadline check)
    console.log('Test 7: POST /bets for matchday 2');
    try {
        const result = await testEndpoint('POST', '/bets', {
            matchday: 2,
            userId: 'integration-test-user',
            bets: [
                { matchId: 'j2_m1', prediction: '1' },
                { matchId: 'j2_m2', prediction: 'X' },
            ],
        });
        if (result.status === 200) {
            console.log('  ✅ PASS - Bet created\n');
            passed++;
        } else {
            console.log(`  ❌ FAIL - Got status ${result.status}: ${JSON.stringify(result.data)}\n`);
            failed++;
        }
    } catch (e) {
        console.log(`  ❌ FAIL - ${e.message}\n`);
        failed++;
    }

    // Test 8: Invalid bet prediction
    console.log('Test 8: POST /bets with invalid prediction');
    try {
        const result = await testEndpoint('POST', '/bets', {
            matchday: 2,
            userId: 'test-user',
            bets: [{ matchId: 'j2_m1', prediction: 'invalid' }],
        });
        if (result.status === 400) {
            console.log('  ✅ PASS - Correctly rejected invalid prediction\n');
            passed++;
        } else {
            console.log(`  ❌ FAIL - Got status ${result.status}\n`);
            failed++;
        }
    } catch (e) {
        console.log(`  ❌ FAIL - ${e.message}\n`);
        failed++;
    }

    // Summary
    console.log('=== Summary ===');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${passed + failed}`);

    if (failed === 0) {
        console.log('\n🎉 All tests passed!');
    } else {
        console.log('\n⚠️  Some tests failed');
        process.exit(1);
    }
}

runTests().catch(console.error);
