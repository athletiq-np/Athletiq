// src/components/ui/StepIndicator.jsx
import React from "react";

const steps = [
  "Sports",
  "Details",
  "Match Format",
  "Review",
];

export default function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center">
            <div
              className={`rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg
                ${i === current ? "bg-athletiq-green text-white" : "bg-athletiq-cream border border-athletiq-blue text-athletiq-blue"}
              `}
            >
              {i + 1}
            </div>
            <div className={`text-xs mt-1 ${i === current ? "font-semibold text-athletiq-green" : "text-athletiq-blue"}`}>
              {label}
            </div>
          </div>
          {i !== steps.length - 1 && (
            <div className={`h-1 w-10 rounded-full ${i < current ? "bg-athletiq-green" : "bg-athletiq-blue/30"}`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
