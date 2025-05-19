import React, {useState, useContext, useEffect} from "react";
import axios from "axios";
import {UserContext} from "../context/UserContext";
import {questions} from "../context/questions";  // Corrected Import Path

const API_URL = 'https://k548-esp-2.onrender.com';

const Calculator = () => {
    const [answers, setAnswers] = useState({});
    const [step, setStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);  // State to hold the result
    const [season, setSeason] = useState("Winter"); // Default to winter
    const [year, setYear] = useState(new Date().getFullYear()); // Current year
    const [mode, setMode] = useState("fast"); // "fast" or "detailed"
    const [loading, setLoading] = useState(false);
    const [unknownSelections, setUnknownSelections] = useState({}); // Track "I don't know" selections

    // Get filtered questions based on mode
    const getFilteredQuestions = () => {
        if (mode === "fast") {
            // In fast mode, exclude questions marked as detailed
            return questions.filter(q => !q.detailed);
        }
        // In detailed mode, include all questions
        return questions;
    };

    const filteredQuestions = getFilteredQuestions();

    // Progress bar calculation
    useEffect(() => {
        const totalQuestions = filteredQuestions.length;
        const completed = ((step + 1) / totalQuestions) * 100;
        setProgress(completed);
    }, [step, filteredQuestions.length]);

    // Get seasonal question text and defaults if applicable
    const getQuestionDisplay = (question) => {
        if (question.seasonal && season && question.seasonal_text && question.seasonal_text[season]) {
            return {
                ...question,
                text: question.seasonal_text[season],
                default_value: question.seasonal_defaults?.[season] || question.default_value
            };
        }
        return question;
    };

    const handleNext = () => {
        const currentQuestion = getQuestionDisplay(filteredQuestions[step]);

        // Validate dropdown selection before proceeding
        if (currentQuestion.type === 'dropdown' && (!answers[currentQuestion.id] || answers[currentQuestion.id] === "")) {
            // Show validation error for dropdowns
            alert("Please select an option before proceeding.");
            return;
        }

        // Check if current question's answer is empty for non-dropdown questions
        if (!answers[currentQuestion.id] && currentQuestion.default_value && currentQuestion.type !== 'dropdown') {
            setAnswers((prev) => ({
                ...prev,
                [currentQuestion.id]: currentQuestion.default_value
            }));
        }

        let nextStep = step + 1;
        while (nextStep < filteredQuestions.length && !shouldRenderQuestion(filteredQuestions[nextStep])) {
            nextStep++;
        }

        if (nextStep < filteredQuestions.length) setStep(nextStep);
    };

    const handlePrevious = () => {
        let previousStep = step - 1;
        while (previousStep >= 0 && !shouldRenderQuestion(filteredQuestions[previousStep])) {
            previousStep--;
        }
        if (previousStep >= 0) setStep(previousStep);
    };

    // Handle "I don't know" option
    const handleUnknown = (questionId) => {
        const question = questions.find(q => q.id === questionId);
        if (question) {
            // Set to default value
            const displayQuestion = getQuestionDisplay(question);
            setAnswers(prev => ({
                ...prev,
                [questionId]: displayQuestion.default_value
            }));

            // Mark as unknown
            setUnknownSelections(prev => ({
                ...prev,
                [questionId]: true
            }));

            // Move to next question immediately
            let nextStep = step + 1;
            while (nextStep < filteredQuestions.length && !shouldRenderQuestion(filteredQuestions[nextStep])) {
                nextStep++;
            }

            if (nextStep < filteredQuestions.length) setStep(nextStep);
        }
    };

    // Capture answer changes
    const handleAnswerChange = (questionId, value) => {
        setAnswers((prev) => {
            const updatedAnswers = {...prev, [questionId]: value};

            // Only apply default values for non-empty values
            // Allow empty strings for numeric inputs to facilitate clearing
            if (value === "" && questions.find(q => q.id === questionId)?.type !== 'input') {
                // Only apply defaults for non-input type questions
                if (questions.find(q => q.id === questionId)?.default_value) {
                    updatedAnswers[questionId] = questions.find(q => q.id === questionId)?.default_value;
                }
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

            // Clear unknown selection if manually changed
            if (unknownSelections[questionId]) {
                setUnknownSelections(prev => {
                    const updated = {...prev};
                    delete updated[questionId];
                    return updated;
                });
            }

            console.log("Updated Answers:", updatedAnswers);
            return updatedAnswers;
        });
    };

    // Dynamic rendering of questions and follow-up conditions
    const currentQuestion = filteredQuestions[step] ? getQuestionDisplay(filteredQuestions[step]) : null;

    const shouldRenderQuestion = (question) => {
        // If no dependency, always render
        if (!question.depends_on) return true;

        // Get the dependency's answer
        const dependencyAnswer = answers[question.depends_on];

        // If the dependency is answered, check if it matches the conditions
        if (dependencyAnswer === undefined) return false;

        return question.conditions.includes(dependencyAnswer);
    };

    // Handle mode toggle
    const toggleMode = () => {
        setMode(mode === "fast" ? "detailed" : "fast");
        setStep(0); // Reset to first question
        setAnswers({}); // Clear answers when switching modes
    };

    // Ensure all questions have answers before submission
    const handleSubmit = async () => {
        // Check if current question is a dropdown and has no value
        const currentQuestion = getQuestionDisplay(filteredQuestions[step]);
        if (currentQuestion.type === 'dropdown' && (!answers[currentQuestion.id] || answers[currentQuestion.id] === "")) {
            alert("Please select an option before submitting.");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            console.log("Token sent in request:", token);

            // Fill in missing answers with default values
            const finalAnswers = {};
            questions.forEach((question) => {
                const displayQuestion = getQuestionDisplay(question);
                finalAnswers[question.id] = answers[question.id] ?? displayQuestion.default_value ?? "";
            });

            console.log("Answers to send:", finalAnswers);
            console.log("Final Data Sent:", JSON.stringify(finalAnswers, null, 2));
            console.log("Season:", season, "Year:", year);

            const response = await axios.post(
                `${API_URL}/footprint?season=${season}&year=${year}`,
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="title is-2">Seasonal Carbon Footprint Calculator</h2>

            {!result && (
                <div className="columns is-vcentered mb-4">
                    <div className="column">
                        <div className="field">
                            <label className="label">Season</label>
                            <div className="control">
                                <div className="select is-fullwidth">
                                    <select value={season} onChange={(e) => setSeason(e.target.value)}>
                                        <option value="Winter">Winter</option>
                                        <option value="Spring">Spring</option>
                                        <option value="Summer">Summer</option>
                                        <option value="Fall">Fall</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="column">
                        <div className="field">
                            <label className="label">Year</label>
                            <div className="control">
                                <input
                                    className="input"
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(parseInt(e.target.value))}
                                    min="2020"
                                    max="2030"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="column">
                        <div className="field">
                            <label className="label">Mode</label>
                            <div className="control">
                                <button className={`button ${mode === "detailed" ? "is-info" : "is-info is-outlined"}`} onClick={toggleMode}>
                                    {mode === "fast" ? (
                                        <>Fast Mode <span className="tag is-light ml-2">Quick Assessment ({filteredQuestions.length} questions)</span></>
                                    ) : (
                                        <>Detailed Mode <span className="tag is-light ml-2">Comprehensive ({filteredQuestions.length} questions)</span></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
            {!result && currentQuestion && shouldRenderQuestion(currentQuestion) && (
                <>
                    <div className="box">
                        <h5 className="title is-5">{currentQuestion.text}</h5>
                        <p className="subtitle is-6 has-text-grey">
                            Category: {currentQuestion.category.replace('_', ' ')}
                        </p>

                        {/* Dropdown Question */}
                        {currentQuestion.type === 'dropdown' && (
                            <div className="field">
                                <div className="control">
                                    <div className="select is-fullwidth">
                                        <select
                                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                            value={answers[currentQuestion.id] ?? ""}
                                        >
                                            {currentQuestion.options.map(option => (
                                                <option key={option} value={option}>
                                                    {option === "" ? "Please, choose option" : option}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {/* "I don't know" option for dropdown */}
                                {currentQuestion.allow_unknown && (
                                    <div className="mt-3">
                                        <button
                                            className="button is-small is-light"
                                            onClick={() => handleUnknown(currentQuestion.id)}
                                        >
                                            I don't know
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Slider Question */}
                        {currentQuestion.type === 'slider' && (
                            <div className="field">
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
                                <p className="has-text-weight-bold mt-2">
                                    {answers[currentQuestion.id] || currentQuestion.min} {currentQuestion.unit || ""}
                                </p>

                                {/* "I don't know" option for slider */}
                                {currentQuestion.allow_unknown && (
                                    <div className="mt-3">
                                        <button
                                            className="button is-small is-light"
                                            onClick={() => handleUnknown(currentQuestion.id)}
                                        >
                                            I don't know
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Input Question */}
                        {currentQuestion.type === 'input' && (
                            <div className="field">
                                <div className="control" style={{ position: 'relative' }}>
                                    <input
                                        className="input is-primary"
                                        type="number"
                                        placeholder={`Enter a number${currentQuestion.unit ? ' in ' + currentQuestion.unit : ''}`}
                                        value={answers[currentQuestion.id] || ""}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // Allow empty value to facilitate erasing numbers
                                            handleAnswerChange(currentQuestion.id, value === "" ? "" : value);
                                        }}
                                    />
                                    {currentQuestion.unit && (
                                        <span style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: '#666'
                                        }}>
                                            {currentQuestion.unit}
                                        </span>
                                    )}
                                </div>

                                {/* "I don't know" option for input */}
                                {currentQuestion.allow_unknown && (
                                    <div className="mt-3">
                                        <button
                                            className="button is-small is-light"
                                            onClick={() => handleUnknown(currentQuestion.id)}
                                        >
                                            I don't know
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
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

                    {step === filteredQuestions.length - 1 ? (
                        <button
                            className="button is-primary is-outlined is-normal"
                            style={{
                                borderWidth: '3px',
                                margin: '10px'
                            }}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? "Calculating..." : "Submit"}
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
                    <div className="notification is-primary">
                        <h3 className="title is-3">
                            {result.season ? `Your ${result.season} ${result.year} Carbon Footprint:` : "Your Carbon Footprint:"}
                        </h3>
                        <h5 className="subtitle is-4">{result.total_carbon_footprint_kg} kg CO₂</h5>
                        <h6 className="subtitle is-6">Calculated using {mode === "fast" ? "Fast" : "Detailed"} mode</h6>
                    </div>

                    <div className="columns">
                        <div className="column is-half">
                            <h4 className="title is-4">Category Breakdown:</h4>
                            <table className="table is-fullwidth">
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Emissions (kg CO₂)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(result.category_breakdown).map(([category, value]) => (
                                        <tr key={category}>
                                            <td>{category.replace('_', ' ')}</td>
                                            <td>{Math.round(value * 100) / 100}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="column is-half">
                            <h4 className="title is-4">Recommendations:</h4>
                            <ul>
                                {result.recommendations.map((rec, index) => (
                                    <li key={index} className="mb-2"><strong>→</strong> {rec}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Display benchmarks if available */}
                    {result.benchmarks && (
                        <div className="mt-5">
                            <h4 className="title is-4">Climate Goals Comparison:</h4>
                            <div className="columns">
                                <div className="column">
                                    <div className="notification is-info">
                                        <p>2030 Goal: {result.benchmarks["2030_goal"] * 1000} kg CO₂ per season</p>
                                        <p>Your footprint is {Math.round((result.total_carbon_footprint_kg / (result.benchmarks["2030_goal"] * 1000)) * 100)}% of the 2030 target</p>
                                    </div>
                                </div>
                                <div className="column">
                                    <div className="notification is-warning">
                                        <p>2050 Goal: {result.benchmarks["2050_goal"] * 1000} kg CO₂ per season</p>
                                        <p>Your footprint is {Math.round((result.total_carbon_footprint_kg / (result.benchmarks["2050_goal"] * 1000)) * 100)}% of the 2050 target</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-5">
                        <button
                            className="button is-primary"
                            onClick={() => {
                                setResult(null);
                                setStep(0);
                            }}
                        >
                            Calculate Another Footprint
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calculator;