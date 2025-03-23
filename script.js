// Recipe Search Elements
const searchBtn = document.getElementById("search-btn");
const mealList = document.getElementById("meal");
const mealDetailsContent = document.querySelector(".meal-details-content");
const recipeCloseBtn = document.getElementById("recipe-close-btn");
const searchBtnIngredient = document.getElementById("search-btn-ingredient");

// Store recipes data
let recipesData = [];
let mealDbData = [];

// Load recipes from both APIs when page loads
async function loadAllRecipes() {
    try {
        // Show loading state
        mealList.innerHTML = '<h2>Loading recipes...</h2>';
        
        // Load DummyJSON recipes
        const dummyResponse = await fetch('https://dummyjson.com/recipes');
        const dummyData = await dummyResponse.json();
        recipesData = dummyData.recipes;

        // Load MealDB recipes (all at once)
        const mealDbResponse = await fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=');
        const mealDbData = await mealDbResponse.json();
        
        let mealDbRecipes = [];
        if (mealDbData.meals) {
            mealDbRecipes = mealDbData.meals.map(meal => ({
                id: meal.idMeal,
                name: meal.strMeal,
                image: meal.strMealThumb,
                cuisine: meal.strArea || "International",
                source: "mealdb",
                ingredients: getIngredients(meal),
                instructions: meal.strInstructions.split('\n'),
                youtube: meal.strYoutube
            }));
        }

        // Combine and display all recipes
        const allRecipes = [...recipesData, ...mealDbRecipes];
        displayMeals(allRecipes);

    } catch (error) {
        console.error('Error loading recipes:', error);
        mealList.innerHTML = '<h2>Error loading recipes. Please try again later.</h2>';
    }
}

// Format MealDB data to match our structure
async function formatMealDbData(meals) {
    if (!meals) return [];
    
    try {
        const formattedMeals = await Promise.all(meals.map(async meal => {
            try {
                // Fetch full meal details
                const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
                const data = await response.json();
                const fullMealDetails = data.meals[0];
                
                return {
                    id: meal.idMeal,
                    name: meal.strMeal || fullMealDetails.strMeal,
                    image: meal.strMealThumb || fullMealDetails.strMealThumb,
                    cuisine: fullMealDetails.strArea || "International",
                    source: "mealdb",
                    ingredients: getIngredients(fullMealDetails),
                    instructions: fullMealDetails.strInstructions.split('\n'),
                    youtube: fullMealDetails.strYoutube
                };
            } catch (error) {
                console.error('Error formatting meal:', error);
                return null;
            }
        }));

        return formattedMeals.filter(meal => meal !== null);
    } catch (error) {
        console.error('Error formatting meals:', error);
        return [];
    }
}

// Helper function to extract ingredients from MealDB data
function getIngredients(meal) {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        if (meal[`strIngredient${i}`] && meal[`strIngredient${i}`].trim()) {
            ingredients.push(`${meal[`strMeasure${i}`]} ${meal[`strIngredient${i}`]}`);
        }
    }
    return ingredients;
}

// Chatbot Elements
const chatbotIcon = document.getElementById('chatbot-icon');
const chatbotPopup = document.getElementById('chatbot-popup');
const closeButton = document.getElementById('close-chatbot');
const sendButton = document.getElementById('send-message');
const chatInput = document.getElementById('chatbot-input');
const messagesContainer = document.getElementById('chatbot-messages');

// Event Listeners
searchBtn.addEventListener("click", () => searchMeals("ingredients"));
searchBtnIngredient.addEventListener("click", () => searchMeals("area"));
mealList.addEventListener("click", getMealRecipe);
recipeCloseBtn.addEventListener("click", () => {
    mealDetailsContent.parentElement.classList.remove("showRecipe");
});

async function searchMeals(searchType) {
    let searchInputTxt = document.getElementById("search-input").value.trim().toLowerCase();
    
    if (searchInputTxt.length === 0) {
        displayMeals(recipesData); // Show all recipes if search is empty
        return;
    }

    try {
        // Simple search in DummyJSON recipes by name or ingredients
        const results = recipesData.filter(recipe => 
            recipe.name.toLowerCase().includes(searchInputTxt) ||
            recipe.ingredients.some(ingredient => 
                ingredient.toLowerCase().includes(searchInputTxt)
            )
        );

        displayMeals(results);
    } catch (error) {
        console.error('Error searching recipes:', error);
        mealList.innerHTML = '<h2>Error searching recipes. Please try again later.</h2>';
    }
}

// Modify the getYoutubeVideoUrl function to return embed URL
async function getYoutubeVideoUrl(recipeName) {
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${recipeName} recipe cooking&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`);
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            return `https://www.youtube.com/embed/${data.items[0].id.videoId}`;
        }
        return null;
    } catch (error) {
        console.error('Error fetching YouTube video:', error);
        return null;
    }
}

// Update showDummyJsonDetails to embed video
async function showDummyJsonDetails(meal) {
    const youtubeUrl = await getYoutubeVideoUrl(meal.name + ' recipe');
    
    let html = `
        <h2 class="recipe-title">${meal.name}</h2>
        <p class="recipe-category">${meal.cuisine}</p>
        <div class="recipe-instruct">
            <h3>Instructions:</h3>
            <p>${meal.instructions.join('<br>')}</p>
        </div>
        <div class="recipe-meal-img">
            <img src="${meal.image}" alt="${meal.name}">
        </div>
        <div class="recipe-details">
            <h3>Ingredients:</h3>
            <ul>
                ${meal.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
            </ul>
            <div class="additional-info">
                <p><strong>Difficulty:</strong> ${meal.difficulty}</p>
                <p><strong>Preparation Time:</strong> ${meal.prepTimeMinutes} minutes</p>
                <p><strong>Cooking Time:</strong> ${meal.cookTimeMinutes} minutes</p>
                <p><strong>Servings:</strong> ${meal.servings}</p>
                <p><strong>Rating:</strong> ${meal.rating} (${meal.reviewCount} reviews)</p>
            </div>
            <div class="recipe-video">
                <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(meal.name + ' recipe')}" 
                   target="_blank" 
                   class="video-btn">
                    <i class="fab fa-youtube"></i> Watch Recipe Videos
                </a>
            </div>
        </div>
    `;
    mealDetailsContent.innerHTML = html;
    mealDetailsContent.parentElement.classList.add("showRecipe");
}

// Modify getMealRecipe to handle async showDummyJsonDetails
async function getMealRecipe(e) {
    e.preventDefault();
    if (e.target.classList.contains("recipe-btn")) {
        let mealItem = e.target.parentElement.parentElement;
        const mealId = mealItem.dataset.id;

        try {
            if (mealItem.classList.contains('mealdb-recipe')) {
                const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
                const data = await response.json();
                if (data.meals) {
                    showMealDbDetails(data.meals[0]);
                }
            } else {
                const meal = recipesData.find(m => m.id === parseInt(mealId));
                if (meal) {
                    await showDummyJsonDetails(meal);
                }
            }
        } catch (error) {
            console.error('Error fetching recipe details:', error);
        }
    }
}

function displayMeals(meals) {
            let html = "";
    if (meals && meals.length > 0) {
        meals.forEach(meal => {
            const isMealDb = meal.source === 'mealdb';
                    html += `
                <div class="meal-item ${isMealDb ? 'mealdb-recipe' : ''}" data-id="${meal.id}">
                            <div class="meal-img">
                        <img src="${meal.image}" alt="${meal.name}">
                            </div>
                            <div class="meal-name">
                        <h3>${meal.name}</h3>
                        <p class="recipe-source">${meal.cuisine}</p>
                                <a href="#" class="recipe-btn">Get Recipe</a>
                            </div>
                        </div>
                    `;
                });
                mealList.classList.remove("notFound");
            } else {
                html = "Sorry, we didn't find any meal!";
                mealList.classList.add("notFound");
            }
            mealList.innerHTML = html;
}

// Update showMealDbDetails to embed video
function showMealDbDetails(meal) {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        if (meal[`strIngredient${i}`]) {
            ingredients.push(`${meal[`strMeasure${i}`]} ${meal[`strIngredient${i}`]}`);
        }
    }

    let html = `
        <h2 class="recipe-title">${meal.strMeal}</h2>
        <p class="recipe-category">${meal.strCategory} (${meal.strArea})</p>
        <div class="recipe-instruct">
            <h3>Instructions:</h3>
            <p>${meal.strInstructions}</p>
        </div>
        <div class="recipe-meal-img">
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        </div>
        <div class="recipe-details">
            <h3>Ingredients:</h3>
            <ul>
                ${ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
            </ul>
            <div class="recipe-video">
                ${meal.strYoutube ? 
                    `<a href="${meal.strYoutube}" target="_blank" class="video-btn">
                        <i class="fab fa-youtube"></i> Watch Recipe Video
                    </a>` : 
                    `<a href="https://www.youtube.com/results?search_query=${encodeURIComponent(meal.strMeal + ' recipe')}" 
                        target="_blank" 
                        class="video-btn">
                        <i class="fab fa-youtube"></i> Find Recipe Videos
                    </a>`
                }
            </div>
        </div>
    `;
    mealDetailsContent.innerHTML = html;
    mealDetailsContent.parentElement.classList.add("showRecipe");
}

// Call loadAllRecipes when the page loads
document.addEventListener('DOMContentLoaded', loadAllRecipes);

// Chatbot Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Toggle chatbot popup
    chatbotIcon.addEventListener('click', () => {
        chatbotPopup.style.display = 'block';
    });

    // Close chatbot
    closeButton.addEventListener('click', () => {
        chatbotPopup.style.display = 'none';
    });

    // Replace with Gemini API call
    async function getChatResponse(message) {
        try {
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyCJErTk7Ayh5c26NJZlGZFTS-wxfgXdIP4', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{
                            text: "You are a helpful cooking assistant. Please provide instructions in a numbered list format with each step on a new line. " + message
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 150,
                        temperature: 0.7
                    }
                })
            });
            
            const data = await response.json();
            let response_text = data.candidates[0].content.parts[0].text;
            
            // Format the response to ensure instructions are on new lines
            if (response_text.includes("Instructions:") || response_text.includes("Steps:")) {
                // Add double line breaks after "Instructions:" or "Steps:"
                response_text = response_text.replace(/(Instructions:|Steps:)/g, '$1\n\n');
                // Add line break before each numbered point
                response_text = response_text.replace(/(\d+\.|\-|\*)\s/g, '\n$1 ');
                // Add line break after each sentence
                response_text = response_text.replace(/([.!?])\s+/g, '$1\n');
                // Remove any extra blank lines
                response_text = response_text.replace(/\n\s*\n/g, '\n\n');
                // Trim extra whitespace
                response_text = response_text.trim();
            }
            
            return response_text;
        } catch (error) {
            console.error('Error:', error);
            return "I apologize, but I'm having trouble connecting right now. Please try again later.";
        }
    }

    // Update send message function
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            console.log('Sending message:', message); // Debug log
            addMessage(message, 'user-message');
            
            // Show loading indicator
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'bot-message';
            loadingDiv.textContent = 'Typing...';
            messagesContainer.appendChild(loadingDiv);
            
            try {
                console.log('Waiting for Gemini response...'); // Debug log
                const response = await getChatResponse(message);
                console.log('Received response:', response); // Debug log
                loadingDiv.remove();
                addMessage(response, 'bot-message');
            } catch (error) {
                console.error('Error in sendMessage:', error); // Debug log
                loadingDiv.remove();
                addMessage("I'm sorry, I couldn't process your request.", 'bot-message');
            }

            // Clear the input field
            chatInput.value = '';
            
            // Optional: Return focus to input field
            chatInput.focus();
        }
    }

    // Add these event listeners
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Close chatbot when clicking outside
    document.addEventListener('click', (e) => {
        if (!chatbotPopup.contains(e.target) && !chatbotIcon.contains(e.target)) {
            chatbotPopup.style.display = 'none';
        }
    });

    // Prevent closing when clicking inside chatbot
    chatbotPopup.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Add this function to handle adding messages to the chat
    function addMessage(message, className) {
        const messageDiv = document.createElement('div');
        messageDiv.className = className;
        messageDiv.textContent = message;
        messagesContainer.appendChild(messageDiv);
        
        // Auto scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
});

// Add smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Add search icon click event for recipe name search
document.querySelector('.fa-search').addEventListener('click', () => searchMeals("ingredients"));

// Add Enter key support for recipe name search
document.getElementById("search-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        searchMeals("ingredients");
    }
});

// Theme toggle functionality with localStorage
const themeToggle = document.getElementById('theme-toggle');
const icon = themeToggle.querySelector('i');

// Check localStorage on page load
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    icon.className = 'fas fa-moon';
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
    
    // Save theme preference to localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});
