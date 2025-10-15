import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from "jspdf";

// --- SVG Icon Components ---
const MedicalIcon = ({ className = "w-8 h-8" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);

const PlusIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const HistoryIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
);

const SearchIcon = ({ className = "w-5 h-5" }) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const DownloadIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);


function App() {
    const [symptoms, setSymptoms] = useState('');
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [commonSymptoms] = useState(['cough', 'fever', 'headache', 'sore throat', 'fatigue', 'runny nose']);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!symptoms.trim()) {
            setError("Please enter your symptoms.");
            return;
        }
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await axios.post('http://localhost:5000/api/symptoms', { symptoms });
            setResult(response.data.analysis);
            fetchHistory(); // Refresh history
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to get a response. Please try again.';
            setError(errorMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/symptoms');
            const sortedHistory = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setHistory(sortedHistory);
        } catch (err) {
            console.error('Failed to fetch history:', err);
        }
    };
    
    const addSymptom = (symptom) => {
        setSymptoms(prev => prev ? `${prev.trim()}, ${symptom}` : symptom);
    };

    const handleDownloadPdf = () => {
        if (!result) return;
        const doc = new jsPDF();
        
        doc.setFontSize(22);
        doc.text("AI Symptom Analysis Report", 105, 20, null, null, "center");

        doc.setFontSize(12);
        doc.text(`Analysis Date: ${new Date().toLocaleString()}`, 105, 30, null, null, "center");
        
        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);

        doc.setFontSize(16);
        doc.text("Symptoms Provided:", 20, 45);
        doc.setFontSize(12);
        const splitSymptoms = doc.splitTextToSize(symptoms, 170);
        doc.text(splitSymptoms, 20, 52);

        doc.setFontSize(16);
        doc.text("AI Generated Summary:", 20, 70);
        doc.setFontSize(12);
        const splitSummary = doc.splitTextToSize(result.summary, 170);
        doc.text(splitSummary, 20, 77);

        let yPos = 100;

        if (result.conditions && result.conditions.length > 0) {
            doc.setFontSize(16);
            doc.text("Potential Conditions:", 20, yPos);
            yPos += 10;
            result.conditions.forEach(condition => {
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text(`- ${condition.name} (${condition.match})`, 25, yPos);
                doc.setFont(undefined, 'normal');
                const splitDesc = doc.splitTextToSize(condition.description, 155);
                doc.text(splitDesc, 30, yPos + 7);
                yPos += (splitDesc.length * 7) + 10;
            });
        }
        
        yPos += 5;

        if (result.nextSteps && result.nextSteps.length > 0) {
            doc.setFontSize(16);
            doc.text("Recommended Next Steps:", 20, yPos);
            yPos += 10;
            result.nextSteps.forEach((step, index) => {
                 if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                 }
                doc.setFontSize(12);
                const splitStep = doc.splitTextToSize(`${index + 1}. ${step}`, 170);
                doc.text(splitStep, 25, yPos);
                yPos += (splitStep.length * 5) + 5;
            });
        }

        doc.save("Symptom_Analysis_Report.pdf");
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const filteredHistory = history.filter(item =>
        item.symptoms.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- Reusable UI Components ---
    const MatchBadge = ({ match }) => {
        let colors = 'bg-gray-700 text-gray-200'; // Default
        if (match === 'Strong Match') colors = 'bg-red-600/90 text-white';
        if (match === 'Possible Match') colors = 'bg-yellow-500/90 text-white';
        return <span className={`text-xs font-semibold mr-2 px-3 py-1 rounded-full ${colors}`}>{match}</span>
    }

    const LoadingIndicator = () => (
         <div className="card-glow bg-[#10141c] p-6 rounded-lg text-center flex flex-col items-center justify-center h-48">
             <svg className="animate-spin h-10 w-10 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
             <p className="mt-4 text-gray-400">Analyzing symptoms... this may take a few moments.</p>
        </div>
    );

    return (
        <div className="bg-[#0A0C10] min-h-screen text-gray-300 font-sans p-4 sm:p-8">
            <header className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-50 flex items-center justify-center gap-4">
                    <MedicalIcon className="w-10 h-10 text-teal-400"/> AI Symptom Checker
                </h1>
                <p className="text-gray-400 mt-3 text-lg">Enter your symptoms for an AI-powered analysis.</p>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <div className="card-glow bg-[#10141c] p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-3 text-gray-100"><PlusIcon /> Your Symptoms</h2>
                        <form onSubmit={handleSubmit}>
                            <textarea
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                className="w-full h-32 bg-[#0A0C10] border border-gray-700 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-shadow"
                                placeholder="e.g., cough, fever, headache..."
                                maxLength={250}
                            />
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-sm text-gray-500">Add symptoms, separated by commas.</p>
                                <div className="text-right text-sm text-gray-500">{symptoms.length}/250</div>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4">
                                {commonSymptoms.map(s => (
                                    <button key={s} type="button" onClick={() => addSymptom(s)} className="bg-[#0A0C10] text-sm text-gray-300 border border-gray-700 rounded-full px-3 py-1 hover:bg-gray-800 hover:border-gray-600 transition-colors">
                                        + {s}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center text-base"
                                disabled={loading}
                            >
                                {loading ? 'Analyzing...' : 'Analyze Symptoms'}
                            </button>
                        </form>
                    </div>

                    {loading && <LoadingIndicator />}
                    {error && <div className="bg-red-900/80 border border-red-700 text-red-200 p-4 rounded-lg">{error}</div>}

                    {result && (
                        <div className="space-y-6 animate-fade-in">
                             <div className="card-glow bg-[#10141c] p-6 rounded-lg">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-2xl font-bold text-gray-100">Summary</h3>
                                    <button onClick={handleDownloadPdf} className="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                                        <DownloadIcon /> Download Report
                                    </button>
                                </div>
                                <p className="text-gray-300 leading-relaxed">{result.summary}</p>
                            </div>

                            {result.conditions?.map((condition, index) => (
                                <div key={index} className="card-glow bg-[#10141c] p-6 rounded-lg">
                                    <h4 className="text-xl font-semibold mb-2 flex items-center text-gray-100"><MatchBadge match={condition.match} /> {condition.name}</h4>
                                    <p className="text-gray-400 leading-relaxed">{condition.description}</p>
                                </div>
                            ))}
                            
                            {result.nextSteps && (
                                <div className="card-glow bg-[#10141c] p-6 rounded-lg">
                                    <h3 className="text-2xl font-bold mb-4 text-gray-100">Recommended Next Steps</h3>
                                    <ol className="list-decimal list-inside space-y-3 text-gray-300">
                                        {result.nextSteps?.map((step, index) => <li key={index} className="pl-2">{step}</li>)}
                                    </ol>
                                </div>
                            )}

                             <div className="bg-red-900/50 p-6 rounded-lg border border-red-800 text-red-200">
                                <p className="font-bold text-lg">Disclaimer</p>
                                <p className="mt-2 text-red-300">{result.disclaimer}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="card-glow bg-[#10141c] p-6 rounded-lg h-fit sticky top-8">
                     <h2 className="text-xl font-semibold mb-4 flex items-center gap-3 text-gray-100"><HistoryIcon /> Your Query History</h2>
                    <div className="relative mb-4">
                        <input 
                          type="text" 
                          placeholder="Search past queries" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-[#0A0C10] border border-gray-700 rounded-md py-2 pl-10 pr-4 text-gray-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <SearchIcon className="text-gray-500" />
                        </div>
                    </div>
                    
                     <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        {filteredHistory.length > 0 ? (
                            filteredHistory.map((item) => (
                                <div key={item._id} className="bg-[#0A0C10] p-4 rounded-md border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer">
                                    <p className="font-semibold text-gray-200 truncate">{item.symptoms}</p>
                                    <p className="text-sm text-gray-500 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                                </div>
                            ))
                        ) : (
                             <p className="text-gray-500 text-center py-8">{history.length > 0 && searchQuery ? "No matches found." : "No history yet."}</p>
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
}

export default App;

