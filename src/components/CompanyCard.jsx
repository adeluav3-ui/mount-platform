import React from "react";

function CompanyCard({ company, onSelect }) {
    return (
        <div className="company-card">
            <h3>{company.company_name}</h3>
            <p>{company.address}</p>
            <button onClick={onSelect}>Send Job</button>
        </div>
    );
}

export default React.memo(CompanyCard);
