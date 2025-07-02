const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testUserLogin() {
    try {
        console.log('🧪 Testing User Login and Session\n');
        
        // Create axios instance with cookie jar
        const axiosInstance = axios.create({
            baseURL: BASE_URL,
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
            console.log('   Response:', loginResponse.data);
            console.log('   Set-Cookie headers:', loginResponse.headers['set-cookie']);
            
            // Test 2: Get User Profile using the same axios instance
            console.log('2. Testing user profile endpoint...');
            const profileResponse = await axiosInstance.get('/users/profile');
            
            if (profileResponse.status === 200) {
                console.log('✅ User profile endpoint working');
                console.log(`   User: ${profileResponse.data.username} (${profileResponse.data.email})`);
                console.log(`   Role: ${profileResponse.data.role}`);
            }
            
        } else {
            console.log('❌ User login failed');
        }
        
        console.log('\n🎉 Login test complete!');
        
    } catch (error) {
        if (error.response) {
            console.error('❌ Test failed:', error.response.status, error.response.data);
        } else {
            console.error('❌ Test failed:', error.message);
        }
    }
}

testUserLogin();
