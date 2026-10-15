import { useState } from "react";

function GroqInsight() {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshAnalysis = () => {
        setIsRefreshing(true);
        window.setTimeout(() => setIsRefreshing(false), 900);
    };

    return (
        <div className="panel groq-panel">

            <div className="panel-heading">

                <div>
                    <div className="ai-title">
                        <span className="ai-icon">✦</span>

                        <h2>
                            Groq Intelligence Brief
                        </h2>
                    </div>

                    <p>
                        AI-generated operational insight
                    </p>
                </div>

                <span className="ai-status">
                        {isRefreshing ? "ANALYZING" : "AI READY"}
                </span>

            </div>

            <div className="ai-content">

                <div className="ai-summary">

                    <strong>
                        Delay detected on CN-1042
                    </strong>

                    <p>
                        The shipment is currently experiencing a
                        significant delay during the road-to-rail
                        transition.
                    </p>

                </div>

                <div className="ai-grid">

                    <div className="ai-box">

                        <span>
                            ROOT CAUSE
                        </span>

                        <strong>
                            Siding congestion
                        </strong>

                    </div>

                    <div className="ai-box">

                        <span>
                            DELAY PROBABILITY
                        </span>

                        <strong>
                            78%
                        </strong>

                    </div>

                    <div className="ai-box">

                        <span>
                            RECOMMENDED ACTION
                        </span>

                        <strong>
                            Prioritize rake allocation
                        </strong>

                    </div>

                </div>

                <button className="ai-action" onClick={refreshAnalysis} disabled={isRefreshing}>
                    {isRefreshing ? "Analyzing network..." : "Generate Updated Analysis →"}
                </button>

            </div>

        </div>
    );
}

export default GroqInsight;