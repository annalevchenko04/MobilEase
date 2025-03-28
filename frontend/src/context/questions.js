export const questions = [
    // 🌍 Home Energy
    {
        "id": "country",
        "category": "Home_Energy",
        "text": "What country do you live in?",
        "type": "dropdown",
        "options": ["","USA", "UK", "Sweden", "France", "Other"],
        "default_value": "USA"
    },
    {
        "id": "home_type",
        "category": "Home_Energy",
        "text": "What type of home do you live in?",
        "type": "dropdown",
        "options": ["","Apartment", "Detached house", "Semi-detached house"],
        "default_value": "Apartment"
    },
    {
        "id": "home_size",
        "category": "Home_Energy",
        "text": "What is the size of your home in square meters?",
        "type": "input",
        "default_value": 20
    },
    {
        "id": "people_in_home",
        "category": "Home_Energy",
        "text": "How many people live in your household?",
        "type": "input",
        "default_value": 2
    },
    {
        "id": "energy_source",
        "category": "Home_Energy",
        "text": "What type of energy source powers your home?",
        "type": "dropdown",
        "options": ["","Natural Gas", "Heating Oil", "Solar", "District Heating"],
        "default_value": "Natural Gas"
    },
    {
        "id": "electricity_usage",
        "category": "Home_Energy",
        "text": "How much electricity do you use monthly (kWh)?",
        "type": "slider",
        "min": 100,
        "max": 1500,
        "default_value": 300
    },

    // 🚗 Transportation
    {
        "id": "car_owner",
        "category": "Transportation",
        "text": "Do you own a car?",
        "type": "dropdown",
        "options": ["","Yes", "No"],
        "default_value": "Yes"
    },
    {
        "id": "car_type",
        "category": "Transportation",
        "text": "What type of car do you own?",
        "type": "dropdown",
        "depends_on": "car_owner",
        "conditions": ["Yes"],
        "options": ["","Petrol", "Diesel", "Hybrid", "Electric"],
        "default_value": "Petrol"
    },
    {
        "id": "car_km",
        "category": "Transportation",
        "text": "How many kilometers do you drive monthly?",
        "type": "slider",
        "depends_on": "car_owner",
        "conditions": ["Yes"],
        "min": 0,
        "max": 3000,
        "default_value": 200
    },
    {
        "id": "flights_per_year",
        "category": "Transportation",
        "text": "How many return flights did you take in the past 12 months?",
        "type": "input",
        "default_value": 5
    },

    // 🛍️ Shopping and Leisure
    {
        "id": "clothing_spend",
        "category": "Shopping_Leisure",
        "text": "How much do you spend on new clothes monthly? (USD)",
        "type": "slider",
        "min": 0,
        "max": 500,
        "default_value": 200
    },
    {
        "id": "electronics_frequency",
        "category": "Shopping_Leisure",
        "text": "How often do you replace electronics?",
        "type": "dropdown",
        "options": ["","Rarely", "Every year", "Every 2 years"],
        "default_value": "Rarely"
    },

    // 🍽️ Food Choices
    {
        "id": "diet_type",
        "category": "Food_Choices",
        "text": "What is your primary diet type?",
        "type": "dropdown",
        "options": ["","Vegan", "Vegetarian", "Pescetarian", "Meat-eater"],
        "default_value": "Vegan"
    },
    {
        "id": "food_waste",
        "category": "Food_Choices",
        "text": "How much food do you waste weekly?",
        "type": "slider",
        "min": 0,
        "max": 50,
        "default_value": 20
    },

    // 💻 Digital Usage
    {
        "id": "emails_sent",
        "category": "Digital_Usage",
        "text": "How many emails do you send weekly?",
        "type": "input",
        "default_value": 50
    },
    {
        "id": "video_calls",
        "category": "Digital_Usage",
        "text": "How much time do you spend on video calls weekly?",
        "type": "input",
        "default_value": 50
    },

    // 🌱 Public Services
    {
        "id": "eco_program",
        "category": "Public_Services",
        "text": "Are you actively investing in eco-friendly programs or green initiatives?",
        "type": "dropdown",
        "options": ["","Yes", "No"],
        "default_value": "Yes"
    }
]