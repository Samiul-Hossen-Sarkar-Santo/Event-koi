const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Category = require('./models/Category');
const User = require('./models/User');

async function seedCategories() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find an admin user to set as the suggester/approver
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            console.error('No admin user found. Please create an admin user first.');
            process.exit(1);
        }

        console.log(`Using admin user: ${adminUser.email}`);

        // Define all categories from the homepage
        const categories = [
            {
                name: 'hackathon',
                displayName: 'Hackathons',
                description: 'Coding competitions and development marathons',
                icon: 'fas fa-laptop-code',
                color: '#8B5CF6' // purple
            },
            {
                name: 'workshop', 
                displayName: 'Workshops',
                description: 'Educational and hands-on learning sessions',
                icon: 'fas fa-chalkboard-teacher',
                color: '#3B82F6' // blue
            },
            {
                name: 'competition',
                displayName: 'Competitions', 
                description: 'Various competitive events and contests',
                icon: 'fas fa-trophy',
                color: '#10B981' // green
            },
            {
                name: 'conference',
                displayName: 'Conferences',
                description: 'Professional meetings and industry discussions',
                icon: 'fas fa-users',
                color: '#F59E0B' // yellow
            },
            {
                name: 'networking',
                displayName: 'Networking',
                description: 'Professional networking and connection events',
                icon: 'fas fa-handshake', 
                color: '#6366F1' // indigo
            },
            {
                name: 'cultural',
                displayName: 'Cultural',
                description: 'Cultural celebrations and educational events',
                icon: 'fas fa-graduation-cap',
                color: '#EC4899' // pink
            },
            {
                name: 'music',
                displayName: 'Music',
                description: 'Musical performances and music-related events',
                icon: 'fas fa-music',
                color: '#EF4444' // red
            },
            {
                name: 'food',
                displayName: 'Food & Drink',
                description: 'Culinary experiences and food-related events',
                icon: 'fas fa-utensils',
                color: '#F97316' // orange
            },
            {
                name: 'sports',
                displayName: 'Sports',
                description: 'Athletic events and sports competitions',
                icon: 'fas fa-running',
                color: '#14B8A6' // teal
            },
            {
                name: 'arts',
                displayName: 'Arts',
                description: 'Creative arts and artistic exhibitions',
                icon: 'fas fa-paint-brush',
                color: '#06B6D4' // cyan
            },
            {
                name: 'wellness',
                displayName: 'Wellness',
                description: 'Health, fitness, and wellness activities',
                icon: 'fas fa-leaf',
                color: '#84CC16' // lime
            },
            {
                name: 'other',
                displayName: 'Other',
                description: 'Miscellaneous events that don\'t fit other categories',
                icon: 'fas fa-ellipsis-h',
                color: '#6B7280' // gray
            }
        ];

        console.log(`\nSeeding ${categories.length} categories...`);

        for (const categoryData of categories) {
            // Check if category already exists
            const existingCategory = await Category.findOne({ name: categoryData.name });
            
            if (existingCategory) {
                console.log(`✓ Category '${categoryData.displayName}' already exists`);
                
                // Update if it's inactive to make it active
                if (!existingCategory.isActive) {
                    existingCategory.isActive = true;
                    existingCategory.status = 'approved';
                    await existingCategory.save();
                    console.log(`  → Activated existing category`);
                }
                continue;
            }

            // Create new category
            const category = new Category({
                name: categoryData.name,
                description: categoryData.description,
                icon: categoryData.icon,
                color: categoryData.color,
                status: 'approved', // Auto-approve since these are system categories
                suggestedBy: adminUser._id,
                approvedBy: adminUser._id,
                isActive: true
            });

            await category.save();
            console.log(`✓ Created category '${categoryData.displayName}'`);
        }

        // Display final status
        const totalCategories = await Category.countDocuments({ isActive: true });
        console.log(`\n🎉 Seeding complete! Total active categories: ${totalCategories}`);

        // List all active categories
        const activeCategories = await Category.find({ isActive: true }).sort({ name: 1 });
        console.log('\nActive categories:');
        activeCategories.forEach(cat => {
            console.log(`  • ${cat.name} - ${cat.description}`);
        });

    } catch (error) {
        console.error('Error seeding categories:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

seedCategories();
