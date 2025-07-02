const axios = require('axios');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');

// Enable cookie jar support
axiosCookieJarSupport(axios);

const BASE_URL = 'http://localhost:3000';

async function testUserDashboard() {
    try {
        console.log('🧪 Testing Enhanced User Dashboard\n');
        
        // Create cookie jar and axios instance
        const cookieJar = new tough.CookieJar();
        const axiosInstance = axios.create({
            baseURL: BASE_URL,
            jar: cookieJar,
            withCredentials: true
        });
        
        // Test 1: User Login
        console.log('1. Testing user login...');
        const loginResponse = await axiosInstance.post('/auth/login', {
            email: 'testuser@eventfinder.com',
            password: 'user123'
        });

        if (loginResponse.status === 200) {
            console.log('✅ User login successful');
            
            // Test 2: Get User Profile
            console.log('2. Testing user profile endpoint...');
            const profileResponse = await axiosInstance.get('/users/profile');
            
            if (profileResponse.status === 200) {
                console.log('✅ User profile endpoint working');
                console.log(`   User: ${profileResponse.data.username} (${profileResponse.data.email})`);
            }
            
            // Test 3: Get User Registrations
            console.log('3. Testing user registrations endpoint...');
            const registrationsResponse = await axiosInstance.get('/users/my-registrations');
            
            if (registrationsResponse.status === 200) {
                const regs = registrationsResponse.data;
                console.log('✅ User registrations endpoint working');
                console.log(`   Upcoming: ${regs.upcoming.length}, Past: ${regs.past.length}`);
            }
            
            // Test 4: Get User Favorites
            console.log('4. Testing user favorites endpoint...');
            const favoritesResponse = await axiosInstance.get('/users/favorites');
            
            if (favoritesResponse.status === 200) {
                console.log(`✅ User favorites endpoint working - Found ${favoritesResponse.data.length} favorites`);
            }
            
            // Test 5: Get Recent Activity
            console.log('5. Testing recent activity endpoint...');
            const activityResponse = await axiosInstance.get('/users/recent-activity');
            
            if (activityResponse.status === 200) {
                console.log(`✅ Recent activity endpoint working - Found ${activityResponse.data.length} activities`);
            }
            
            // Test 6: Get User Notices
            console.log('6. Testing user notices endpoint...');
            const noticesResponse = await axiosInstance.get('/users/notices');
            
            if (noticesResponse.status === 200) {
                const notices = noticesResponse.data;
                console.log(`✅ User notices endpoint working - Found ${notices.notices.length} notices, ${notices.unreadCount} unread`);
            }
            
        } else {
            console.log('❌ User login failed');
        }
        
        console.log('\n🎉 User dashboard test complete!');
        
    } catch (error) {
        if (error.response) {
            console.error('❌ Test failed:', error.response.status, error.response.data);
        } else {
            console.error('❌ Test failed:', error.message);
        }
    }
}

testUserDashboard();
