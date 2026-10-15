function StatCard({
    title,
    value,
    change,
    description,
    type
}) {

    return (
        <div className="stat-card">

            <div className="stat-top">

                <span className="stat-title">
                    {title}
                </span>

                <div className={`stat-icon ${type}`}>
                    {type === "total" && "▦"}
                    {type === "transit" && "→"}
                    {type === "delivered" && "✓"}
                    {type === "delayed" && "!"}
                </div>

            </div>

            <div className="stat-value">
                {value}
            </div>

            <div className="stat-bottom">

                <span className={`stat-change ${type}`}>
                    {change}
                </span>

                <span className="stat-description">
                    {description}
                </span>

            </div>

        </div>
    );
}

export default StatCard;