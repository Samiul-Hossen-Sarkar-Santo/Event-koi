const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAdminWorkflow() {
    try {
        console.log('🧪 Testing Admin Workflow\n');
        
        // Test 1: Admin Login
        console.log('1. Testing admin login...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'test-admin@eventfinder.com',
            password: 'admin123'
        }, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (loginResponse.status === 200 && loginResponse.data.role === 'admin') {
            console.log('✅ Admin login successful');
            
            // Extract cookies for subsequent requests
            const cookies = loginResponse.headers['set-cookie'];
            const cookieHeader = cookies ? cookies.join('; ') : '';
            
            // Test 2: Access Admin Dashboard (HTML page)
            console.log('2. Testing admin dashboard HTML page...');
            const dashboardResponse = await axios.get(`${BASE_URL}/admin.html`, {
                headers: {
                    Cookie: cookieHeader
                }
            });
            
            if (dashboardResponse.status === 200) {
                console.log('✅ Admin dashboard HTML accessible');
                
                // Test 3: Get Dashboard Stats
                console.log('3. Testing dashboard stats endpoint...');
                const statsResponse = await axios.get(`${BASE_URL}/admin/dashboard/stats`, {
                    headers: {
                        Cookie: cookieHeader
                    }
                });
                
                if (statsResponse.status === 200) {
                    console.log('✅ Dashboard stats endpoint working');
                    console.log(`   Stats: ${JSON.stringify(statsResponse.data, null, 2)}`);
                } else {
                    console.log('❌ Dashboard stats endpoint failed');
                }
                
                // Test 4: Get Reports
                console.log('4. Testing reports endpoint...');
                const reportsResponse = await axios.get(`${BASE_URL}/admin/reports`, {
                    headers: {
                        Cookie: cookieHeader
                    }
                });
                
                if (reportsResponse.status === 200) {
                    const reports = reportsResponse.data.reports || [];
                    console.log(`✅ Reports endpoint working - Found ${reports.length} reports`);
                    reports.forEach((report, index) => {
                        console.log(`   Report ${index + 1}: ${report.reportType} - ${report.reason} (${report.status})`);
                    });
                } else {
                    console.log('❌ Reports endpoint failed');
                }
                
                // Test 5: Get Users Management
                console.log('5. Testing users management endpoint...');
                const usersResponse = await axios.get(`${BASE_URL}/admin/users/management`, {
                    headers: {
                        Cookie: cookieHeader
                    }
                });
                
                if (usersResponse.status === 200) {
                    console.log(`✅ Users management endpoint working - Found ${usersResponse.data.length} users`);
                } else {
                    console.log('❌ Users management endpoint failed');
                }
                
                // Test 6: Get Events Approval Queue
                console.log('6. Testing events approval queue endpoint...');
                const eventsResponse = await axios.get(`${BASE_URL}/admin/events/approval-queue`, {
                    headers: {
                        Cookie: cookieHeader
                    }
                });
                
                if (eventsResponse.status === 200) {
                    console.log(`✅ Events approval queue endpoint working - Found ${eventsResponse.data.totalEvents} events`);
                } else {
                    console.log('❌ Events approval queue endpoint failed');
                }
                
            } else {
                console.log('❌ Admin dashboard HTML not accessible');
            }
            
        } else {
            console.log('❌ Admin login failed');
        }
        
        console.log('\n🎉 Admin workflow test complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Check if axios is available, if not provide instructions
async function checkDependencies() {
    try {
        require('axios');
        await testAdminWorkflow();
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('axios')) {
            console.log('⚠️  axios not found. Installing...');
            const { spawn } = require('child_process');
            
            const install = spawn('npm', ['install', 'axios'], { 
                stdio: 'inherit',
                shell: true 
            });
            
            install.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ axios installed. Please run the test again.');
                } else {
                    console.log('❌ Failed to install axios. Please run: npm install axios');
                }
            });
        } else {
            throw error;
        }
    }
}

checkDependencies();
