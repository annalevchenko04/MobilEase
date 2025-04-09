questions = [
    # 🌍 Home Energy
    {
        "id": "country",
        "category": "Home_Energy",
        "text": "What country do you live in?",
        "type": "dropdown",
        "options": ["", "USA", "UK", "Sweden", "France", "Other"],
        "default_value": "USA"
    },
    {
        "id": "home_type",
        "category": "Home_Energy",
        "text": "What type of home do you live in?",
        "type": "dropdown",
        "options": ["", "Apartment", "Detached house", "Semi-detached house"],
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
        "options": ["", "Natural Gas", "Heating Oil", "Solar", "District Heating"],
        "default_value": "Natural Gas",
        "allow_unknown": True  # Flag to allow "I don't know" option
    },
    {
        "id": "electricity_usage",
        "category": "Home_Energy",
        "text": "How much electricity do you use monthly (kWh)?",
        "type": "slider",
        "min": 100,
        "max": 1500,
        "default_value": 300,
        "seasonal": True,  # Flag for seasonal variation
        "seasonal_text": {
            "Winter": "How much electricity do you use monthly in winter (kWh)?",
            "Spring": "How much electricity do you use monthly in spring (kWh)?",
            "Summer": "How much electricity do you use monthly in summer (kWh)?",
            "Fall": "How much electricity do you use monthly in fall (kWh)?"
        },
        "seasonal_defaults": {
            "Winter": 400,
            "Spring": 300,
            "Summer": 350,
            "Fall": 300
        },
        "allow_unknown": True  # Flag to allow "I don't know" option
    },

    # 🚗 Transportation
    {
        "id": "car_owner",
        "category": "Transportation",
        "text": "Do you own a car?",
        "type": "dropdown",
        "options": ["", "Yes", "No"],
        "default_value": "Yes"
    },
    {
        "id": "car_type",
        "category": "Transportation",
        "text": "What type of car do you own?",
        "type": "dropdown",
        "depends_on": "car_owner",
        "conditions": ["Yes"],
        "options": ["", "Petrol", "Diesel", "Hybrid", "Electric"],
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
        "default_value": 200,
        "seasonal": True,
        "seasonal_text": {
            "Winter": "How many kilometers do you drive monthly in winter?",
            "Spring": "How many kilometers do you drive monthly in spring?",
            "Summer": "How many kilometers do you drive monthly in summer?",
            "Fall": "How many kilometers do you drive monthly in fall?"
        },
        "seasonal_defaults": {
            "Winter": 180,
            "Spring": 200,
            "Summer": 250,
            "Fall": 200
        },
        "allow_unknown": True  # Flag to allow "I don't know" option
    },
    {
        "id": "flights_per_year",
        "category": "Transportation",
        "text": "How many return flights did you take in the past 12 months?",
        "type": "input",
        "default_value": 5,
        "seasonal": True,
        "seasonal_text": {
            "Winter": "How many return flights do you typically take in winter?",
            "Spring": "How many return flights do you typically take in spring?",
            "Summer": "How many return flights do you typically take in summer?",
            "Fall": "How many return flights do you typically take in fall?"
        },
        "seasonal_defaults": {
            "Winter": 1,
            "Spring": 1,
            "Summer": 2,
            "Fall": 1
        }
    },

    # 🛍️ Shopping and Leisure
    {
        "id": "clothing_spend",
        "category": "Shopping_Leisure",
        "text": "How much do you spend on new clothes monthly? (USD)",
        "type": "slider",
        "min": 0,
        "max": 500,
        "default_value": 200,
        "seasonal": True,
        "seasonal_text": {
            "Winter": "How much do you spend on new clothes monthly in winter? (USD)",
            "Spring": "How much do you spend on new clothes monthly in spring? (USD)",
            "Summer": "How much do you spend on new clothes monthly in summer? (USD)",
            "Fall": "How much do you spend on new clothes monthly in fall? (USD)"
        },
        "seasonal_defaults": {
            "Winter": 150,
            "Spring": 200,
            "Summer": 150,
            "Fall": 250
        },
        "allow_unknown": True  # Flag to allow "I don't know" option
    },
    {
        "id": "electronics_frequency",
        "category": "Shopping_Leisure",
        "text": "How often do you replace electronics?",
        "type": "dropdown",
        "options": ["", "Rarely", "Every year", "Every 2 years"],
        "default_value": "Rarely",
        "allow_unknown": True  # Flag to allow "I don't know" option
    },

    # 🍽️ Food Choices
    {
        "id": "diet_type",
        "category": "Food_Choices",
        "text": "What is your primary diet type?",
        "type": "dropdown",
        "options": ["", "Vegan", "Vegetarian", "Pescetarian", "Meat-eater"],
        "default_value": "Vegan",
        "seasonal": True,
        "seasonal_text": {
            "Winter": "What is your primary diet type in winter?",
            "Spring": "What is your primary diet type in spring?",
            "Summer": "What is your primary diet type in summer?",
            "Fall": "What is your primary diet type in fall?"
        }
    },
    {
        "id": "food_waste",
        "category": "Food_Choices",
        "text": "How much food do you waste weekly?(kg)",
        "type": "slider",
        "min": 0,
        "max": 50,
        "default_value": 20,
        "allow_unknown": True  # Flag to allow "I don't know" option
    },
    {
        "id": "local_food",
        "category": "Food_Choices",
        "text": "What percentage of your food is locally sourced?",
        "type": "dropdown",
        "options": ["", "Minimal (<10%)", "Some (10-30%)", "Substantial (30-60%)", "Majority (>60%)"],
        "default_value": "Some (10-30%)",
        "detailed": True,  # Mark as detailed question for progressive mode
        "seasonal": True,
        "seasonal_text": {
            "Winter": "What percentage of your food is locally sourced in winter?",
            "Spring": "What percentage of your food is locally sourced in spring?",
            "Summer": "What percentage of your food is locally sourced in summer?",
            "Fall": "What percentage of your food is locally sourced in fall?"
        },
        "seasonal_defaults": {
            "Winter": "Minimal (<10%)",
            "Spring": "Some (10-30%)",
            "Summer": "Substantial (30-60%)",
            "Fall": "Some (10-30%)"
        }
    },

    # 💻 Digital Usage
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
        "text": "How much time do you spend on video calls weekly (hours)?",
        "type": "input",
        "default_value": 5,
        "seasonal": True,
        "seasonal_text": {
            "Winter": "How much time do you spend on video calls weekly in winter (hours)?",
            "Spring": "How much time do you spend on video calls weekly in spring (hours)?",
            "Summer": "How much time do you spend on video calls weekly in summer (hours)?",
            "Fall": "How much time do you spend on video calls weekly in fall (hours)?"
        },
        "seasonal_defaults": {
            "Winter": 6,
            "Spring": 5,
            "Summer": 3,
            "Fall": 5
        }
    },
    {
        "id": "streaming",
        "category": "Digital_Usage",
        "text": "What is your typical online streaming usage?",
        "type": "dropdown",
        "options": ["", "Low (<5 hrs/week)", "Medium (5-15 hrs/week)", "High (15-30 hrs/week)",
                    "Very High (>30 hrs/week)"],
        "default_value": "Medium (5-15 hrs/week)",
        "seasonal": True,
        "seasonal_text": {
            "Winter": "What is your typical online streaming usage in winter?",
            "Spring": "What is your typical online streaming usage in spring?",
            "Summer": "What is your typical online streaming usage in summer?",
            "Fall": "What is your typical online streaming usage in fall?"
        },
        "seasonal_defaults": {
            "Winter": "High (15-30 hrs/week)",
            "Spring": "Medium (5-15 hrs/week)",
            "Summer": "Low (<5 hrs/week)",
            "Fall": "Medium (5-15 hrs/week)"
        }
    },
    {
        "id": "cloud_storage",
        "category": "Digital_Usage",
        "text": "How much cloud storage do you use?",
        "type": "dropdown",
        "options": ["", "Minimal (<50GB)", "Average (50-500GB)", "High (>500GB)"],
        "default_value": "Average (50-500GB)",
        "detailed": True  # Mark as detailed question for progressive mode
    },

    # 🌱 Public Services
    {
        "id": "eco_program",
        "category": "Public_Services",
        "text": "Are you actively investing in eco-friendly programs or green initiatives?",
        "type": "dropdown",
        "options": ["", "Yes", "No"],
        "default_value": "Yes"
    },

    # 🌎 Demographics (added for the new methodology)
    {
        "id": "location_type",
        "category": "Demographics",
        "text": "Do you live in an urban or rural area?",
        "type": "dropdown",
        "options": ["", "Urban", "Suburban", "Rural"],
        "default_value": "Urban",
        "detailed": True  # Mark as detailed question for progressive mode
    },
    {
        "id": "housing_situation",
        "category": "Demographics",
        "text": "What is your housing situation?",
        "type": "dropdown",
        "options": ["", "Homeowner", "Renter", "Shared housing"],
        "default_value": "Renter",
        "detailed": True  # Mark as detailed question for progressive mode
    }
]