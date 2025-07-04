// Centralized category management utility
// This file provides common functions for fetching and displaying categories

/**
 * Fetch categories from the server for different use cases
 */
class CategoryManager {
    
    /**
     * Get categories for dropdown/select elements
     * @returns {Promise<Array>} Array of {value, label, name} objects
     */
    static async getDropdownCategories() {
        try {
            const response = await fetch('/categories/dropdown');
            if (response.ok) {
                const categories = await response.json();
                // Use category name instead of description for filtering
                return categories.map(cat => ({
                    value: cat.name,
                    label: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
                    name: cat.name
                }));
            } else {
                console.error('Failed to fetch dropdown categories');
                return this.getFallbackDropdownCategories();
            }
        } catch (error) {
            console.error('Error fetching dropdown categories:', error);
            return this.getFallbackDropdownCategories();
        }
    }

    /**
     * Get categories for homepage display
     * @returns {Promise<Array>} Array of category objects with display properties
     */
    static async getHomepageCategories() {
        try {
            const response = await fetch('/categories/homepage');
            if (response.ok) {
                return await response.json();
            } else {
                console.error('Failed to fetch homepage categories');
                return this.getFallbackHomepageCategories();
            }
        } catch (error) {
            console.error('Error fetching homepage categories:', error);
            return this.getFallbackHomepageCategories();
        }
    }

    /**
     * Get all active categories
     * @returns {Promise<Array} Array of category objects
     */
    static async getAllCategories() {
        try {
            const response = await fetch('/categories');
            if (response.ok) {
                return await response.json();
            } else {
                console.error('Failed to fetch all categories');
                return this.getFallbackCategories();
            }
        } catch (error) {
            console.error('Error fetching all categories:', error);
            return this.getFallbackCategories();
        }
    }

    /**
     * Populate a select element with category options
     * @param {HTMLSelectElement} selectElement - The select element to populate
     * @param {string} selectedValue - The value to select by default
     * @param {boolean} addAllOption - Whether to add an "All Categories" option
     */
    static async populateSelect(selectElement, selectedValue = '', addAllOption = false) {
        if (!selectElement) return;

        try {
            const categories = await this.getDropdownCategories();
            
            // Clear existing options
            selectElement.innerHTML = '';
            
            // Add "All Categories" option if requested
            if (addAllOption) {
                const allOption = document.createElement('option');
                allOption.value = '';
                allOption.textContent = 'All Categories';
                selectElement.appendChild(allOption);
            }
            
            // Add category options
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.value;
                option.textContent = category.label;
                if (category.value === selectedValue) {
                    option.selected = true;
                }
                selectElement.appendChild(option);
            });
            
        } catch (error) {
            console.error('Error populating select element:', error);
        }
    }

    /**
     * Render homepage category grid
     * @param {HTMLElement} container - The container element to render categories in
     */
    static async renderHomepageCategories(container) {
        if (!container) return;

        try {
            const categories = await this.getHomepageCategories();
            
            container.innerHTML = categories.map(category => `
                <a href="${category.url}" class="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg p-4 text-center smooth-transition">
                    <div class="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-xl" 
                         style="background-color: ${category.color}20; color: ${category.color};">
                        <i class="${category.icon}"></i>
                    </div>
                    <span class="font-medium dark:text-white">${category.displayName}</span>
                </a>
            `).join('');
            
        } catch (error) {
            console.error('Error rendering homepage categories:', error);
            // Show fallback content
            container.innerHTML = '<p class="text-center text-gray-500">Unable to load categories</p>';
        }
    }

    /**
     * Create filter buttons for category filtering
     * @param {HTMLElement} container - The container for filter buttons
     * @param {Function} onFilterChange - Callback function when filter changes
     * @param {string} activeCategory - Currently active category
     */
    static async renderCategoryFilters(container, onFilterChange, activeCategory = 'all') {
        if (!container) return;

        try {
            const categories = await this.getDropdownCategories();
            
            // Create "All" button
            let buttonsHTML = `
                <button class="home-category-filter ${activeCategory === 'all' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} hover:bg-purple-200 dark:hover:bg-purple-800 px-4 py-2 rounded-full text-sm" data-category="all">
                    All
                </button>
            `;
            
            // Add category buttons using category names
            buttonsHTML += categories.map(category => `
                <button class="home-category-filter ${activeCategory === category.value ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-full text-sm" data-category="${category.value}">
                    ${category.label}
                </button>
            `).join('');
            
            container.innerHTML = buttonsHTML;
            
            // Add click listeners
            container.querySelectorAll('.home-category-filter').forEach(button => {
                button.addEventListener('click', () => {
                    const category = button.getAttribute('data-category');
                    
                    // Update button styles
                    container.querySelectorAll('.home-category-filter').forEach(btn => {
                        btn.className = btn.className.replace(/bg-purple-\d+|text-purple-\d+/g, '');
                        btn.className += ' bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
                    });
                    
                    button.className = button.className.replace(/bg-gray-\d+|text-gray-\d+/g, '');
                    button.className += ' bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300';
                    
                    if (onFilterChange) {
                        onFilterChange(category);
                    }
                });
            });
            
        } catch (error) {
            console.error('Error rendering category filters:', error);
        }
    }

    /**
     * Create filter buttons for Events page category filtering
     * @param {HTMLElement} container - The container for filter buttons
     * @param {Function} onFilterChange - Callback function when filter changes
     * @param {string} activeCategory - Currently active category
     */
    static async renderEventsCategoryFilters(container, onFilterChange, activeCategory = 'all') {
        if (!container) return;

        try {
            const categories = await this.getDropdownCategories();
            
            // Create "All Events" button
            let buttonsHTML = `
                <button class="category-filter ${activeCategory === 'all' ? 'active' : ''}" data-category="all">
                    All Events
                </button>
            `;
            
            // Add category buttons
            buttonsHTML += categories.map(category => `
                <button class="category-filter ${activeCategory === category.value ? 'active' : ''}" data-category="${category.value}">
                    ${category.label}
                </button>
            `).join('');
            
            container.innerHTML = buttonsHTML;
            
            // Add click listeners
            container.querySelectorAll('.category-filter').forEach(button => {
                button.addEventListener('click', () => {
                    const category = button.getAttribute('data-category');
                    
                    // Update button styles
                    container.querySelectorAll('.category-filter').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    button.classList.add('active');
                    
                    if (onFilterChange) {
                        onFilterChange(category);
                    }
                });
            });
            
        } catch (error) {
            console.error('Error rendering events category filters:', error);
            // Show fallback content
            container.innerHTML = '<p class="text-gray-500">Unable to load category filters</p>';
        }
    }

    // Fallback categories in case of network issues
    static getFallbackDropdownCategories() {
        return [
            { value: 'hackathon', label: 'Hackathon', name: 'hackathon' },
            { value: 'workshop', label: 'Workshop', name: 'workshop' },
            { value: 'competition', label: 'Competition', name: 'competition' },
            { value: 'conference', label: 'Conference', name: 'conference' },
            { value: 'networking', label: 'Networking', name: 'networking' },
            { value: 'cultural', label: 'Cultural', name: 'cultural' },
            { value: 'other', label: 'Other', name: 'other' }
        ];
    }

    static getFallbackHomepageCategories() {
        return [
            { name: 'hackathon', displayName: 'Hackathons', icon: 'fas fa-laptop-code', color: '#8B5CF6', url: 'events.html?category=hackathon' },
            { name: 'workshop', displayName: 'Workshops', icon: 'fas fa-chalkboard-teacher', color: '#3B82F6', url: 'events.html?category=workshop' },
            { name: 'competition', displayName: 'Competitions', icon: 'fas fa-trophy', color: '#10B981', url: 'events.html?category=competition' },
            { name: 'conference', displayName: 'Conferences', icon: 'fas fa-users', color: '#F59E0B', url: 'events.html?category=conference' },
            { name: 'networking', displayName: 'Networking', icon: 'fas fa-handshake', color: '#6366F1', url: 'events.html?category=networking' },
            { name: 'cultural', displayName: 'Cultural', icon: 'fas fa-graduation-cap', color: '#EC4899', url: 'events.html?category=cultural' }
        ];
    }

    static getFallbackCategories() {
        return this.getFallbackDropdownCategories();
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryManager;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.CategoryManager = CategoryManager;
}
