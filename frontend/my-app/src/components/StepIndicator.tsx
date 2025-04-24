import React from 'react';

type StepIndicatorProps = {
  steps: string[];
  currentStep: number; // 0-based index
};

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-center space-x-4 mt-8 text-2xl p-8">
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={index} className="flex items-center space-x-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold
                ${isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-300'}
              `}
            >
              {index + 1}
            </div>
            <span
              className={`text-2xl font-medium ${
                isCompleted || isActive ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
            {index < steps.length - 1 && (
              <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
