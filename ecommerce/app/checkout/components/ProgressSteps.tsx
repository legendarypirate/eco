"use client";

interface ProgressStepsProps {
  step: number;
}

const ProgressSteps = ({ step }: ProgressStepsProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= stepNum ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div className={`h-1 w-20 ${step >= stepNum + 1 ? 'bg-gray-900' : 'bg-gray-200'}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center text-sm">
        {['Мэдээлэл', 'Төлбөр', 'Баталгаажуулалт'].map((label, index) => (
          <div key={label} className="text-center w-24 mr-20 last:mr-0">
            <div className={`font-medium ${step >= index + 1 ? 'text-gray-900' : 'text-gray-400'}`}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressSteps;

