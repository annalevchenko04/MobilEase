import React, {useState, useContext, useEffect} from "react";
import axios from "axios";
import {UserContext} from "../context/UserContext";
import {questions} from "../context/questions";  // Corrected Import Path

const Calculator = () => {
    const [answers, setAnswers] = useState({});
    const [step, setStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);  // State to hold the result


    // Progress bar calculation
    useEffect(() => {
        const totalQuestions = questions.length;
        const completed = ((step + 1) / totalQuestions) * 100;
        setProgress(completed);
    }, [step]);

    const handleNext = () => {
        const currentQuestion = questions[step];

        // Check if current question's answer is empty
        if (!answers[currentQuestion.id] && currentQuestion.default_value) {
            setAnswers((prev) => ({
                ...prev,
                [currentQuestion.id]: currentQuestion.default_value
            }));
        }

        let nextStep = step + 1;
        while (nextStep < questions.length && !shouldRenderQuestion(questions[nextStep])) {
            nextStep++;
        }

        if (nextStep < questions.length) setStep(nextStep);
    };

    const handlePrevious = () => {
        let previousStep = step - 1;
        while (previousStep >= 0 && !shouldRenderQuestion(questions[previousStep])) {
            previousStep--;
        }
        if (previousStep >= 0) setStep(previousStep);
    };

    // Capture answer changes
    // const handleAnswerChange = (questionId, value) => {
    // setAnswers(prev => {
    //     const updatedAnswers = { ...prev, [questionId]: value || questions.find(q => q.id === questionId)?.default_value };
    //     console.log(updatedAnswers);  // Debugging the state updates
    //     return updatedAnswers;
    // });


    // // Mapping for numeric conversion
    // const mappingCorrections = {
    //     car_owner: {"Yes": 1, "No": 0},
    //     car_type: {"Petrol": 1, "Diesel": 2, "Electric": 3, "Hybrid": 4},
    //     energy_source: {
    //         "Electricity": 1,
    //         "Natural Gas": 2,
    //         "Heating Oil": 3,
    //         "Solar": 4,
    //         "District Heating": 5
    //     },
    //     diet_type: {
    //         "Vegan": "Vegan",
    //         "Vegetarian": "Vegetarian",
    //         "Pescetarian": "Pescetarian",
    //         "Meat-eater": "Meat-eater",
    //         "Heavy Meat-eater": "heavy_meat_eater"
    //     },
    //     eco_program: {"Yes": 1, "No": 0},
    //     home_type: {"Apartment": 1, "Detached house": 2, "Semi-detached house": 3}
    // };
    const handleAnswerChange = (questionId, value) => {
        setAnswers((prev) => {
            const updatedAnswers = {...prev, [questionId]: value};

            // Default empty values to default or 'No'
            if (!value && questions.find(q => q.id === questionId)?.default_value) {
                updatedAnswers[questionId] = questions.find(q => q.id === questionId)?.default_value;
            }

            // Special logic for conditional fields
            if (questionId === "car_owner") {
                updatedAnswers[questionId] = value || "No";
                if (value === "No") {
                    delete updatedAnswers["car_type"];
                    delete updatedAnswers["car_km"];
                } else {
                    updatedAnswers["car_km"] = updatedAnswers["car_km"] ?? 0;
                }
            }

            if (questionId === "eco_program") {
                updatedAnswers[questionId] = value || "No";
            }

            console.log("Updated Answers:", updatedAnswers);
            return updatedAnswers;
        });
    };

    // Dynamic rendering of questions and follow-up conditions
    const currentQuestion = questions[step];

    const shouldRenderQuestion = (question) => {
        // If no dependency, always render
        if (!question.depends_on) return true;

        // Get the dependency's answer
        const dependencyAnswer = answers[question.depends_on];

        // If the dependency is answered, check if it matches the conditions
        if (dependencyAnswer === undefined) return false;

        return question.conditions.includes(dependencyAnswer);
    };

// Ensure all questions have answers before submission
    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem("token");
            console.log("Token sent in request:", token);

            // Fill in missing answers with default values
            const finalAnswers = {};
            questions.forEach((question) => {
                finalAnswers[question.id] = answers[question.id] ?? question.default_value ?? "";
            });

            console.log("Answers to send:", finalAnswers);
            console.log("Final Data Sent:", JSON.stringify(finalAnswers, null, 2));
            const response = await axios.post(
                "http://localhost:8000/footprint",
                {answers: finalAnswers},
                {
                    headers: {
                        "Content-Type": "application/json",   // Ensure this matches the backend
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setResult(response.data);
        } catch (error) {
            alert("Error calculating footprint. Please try again.");
            console.error(error);
        }
    };

    return (
        <div>

            <h2 className="title is-2">Footprint Calculator</h2>
            {/* Progress Bar */}
             {!result && (
            <div style={{
                width: "100%",
                backgroundColor: "#ddd",
                height: "20px",
                borderRadius: "10px",
                marginBottom: "20px"
            }}>
                <div style={{
                    width: `${progress}%`,
                    height: "100%",
                    backgroundColor: "#18D9A8",
                    borderRadius: "10px"
                }}/>
            </div>
                 )}

            {/* Current Question */}
            {!result && shouldRenderQuestion(currentQuestion) && (
                <>
                    <h5 className="title is-5">{currentQuestion.text}</h5>

                    {/* Dropdown Question */}
                    {currentQuestion.type === 'dropdown' && (
                        <div className="field">
                            <label className="label">{currentQuestion.label}</label>
                            <div className="control">
                                <div className="select is-fullwidth">
                                    <select
                                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                        value={answers[currentQuestion.id] ?? ""}
                                    >
                                        {currentQuestion.options.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Slider Question */}
                    {currentQuestion.type === 'slider' && (
                        <div className="field">
                            <label className="label">{currentQuestion.label}</label>
                            <div className="control">
                                <input
                                    className="slider is-fullwidth is-primary"
                                    type="range"
                                    min={currentQuestion.min}
                                    max={currentQuestion.max}
                                    value={answers[currentQuestion.id] || currentQuestion.min}
                                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                />
                            </div>
                            <p className="has-text-weight-bold">
                                {answers[currentQuestion.id] || currentQuestion.min}
                            </p>
                        </div>
                    )}

                    {/* Input Question */}
                    {currentQuestion.type === 'input' && (
    <div className="field">
        <label className="label">{currentQuestion.label}</label>
        <div className="control">
            <input
                className="input is-primary"
                type="number"
                placeholder="Enter a number"
                value={answers[currentQuestion.id] || ""}  // If there's no value, show an empty string
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            />
        </div>
    </div>
)}

                    <br/>
                    <br/>
                    <br/>
                </>
            )}

            {!result && (
                <div style={{
                    marginTop: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "0 20px"
                }}>
                    <button
                        className="button is-primary is-outlined is-normal"
                        style={{
                            borderWidth: '3px',
                            margin: '10px'
                        }}
                        onClick={handlePrevious}
                        disabled={step === 0}
                    >
                        ← Previous
                    </button>

                    {step === questions.length - 1 ? (
                        <button
                            className="button is-primary is-outlined is-normal"
                            style={{
                                borderWidth: '3px',
                                margin: '10px'
                            }}
                            onClick={handleSubmit}
                        >
                            Submit
                        </button>
                    ) : (
                        <button
                            className="button is-primary is-outlined is-normal"
                            style={{
                                borderWidth: '3px',
                                margin: '10px'
                            }}
                            onClick={handleNext}
                        >
                            Next →
                        </button>
                    )}
                </div>
            )}

            {/* Display Result on Screen */}
            {result && (
                <div style={{marginTop: "30px"}}>
                    <p>Total Carbon Footprint: {result.total_carbon_footprint_kg} kg CO₂</p>
                    <br/>
                    <h4 className="title is-4">Category Breakdown:</h4>
                    <ul>
                        {Object.entries(result.category_breakdown).map(([category, value]) => (
                            <li key={category}>{category}: {value} kg CO₂</li>
                        ))}
                    </ul>
                    <br/>
                    <h4 className="title is-4">Recommendations:</h4>
                    <ul>
                        {result.recommendations.map((rec, index) => (
                            <li key={index}><strong>-></strong> {rec}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>

    );
};

export default Calculator;
