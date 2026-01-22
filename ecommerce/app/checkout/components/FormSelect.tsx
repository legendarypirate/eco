"use client";

interface FormSelectProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLSelectElement>) => void;
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
}

const FormSelect = ({
  name,
  value,
  onChange,
  onKeyDown,
  label,
  required = false,
  options,
}: FormSelectProps) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && '*'}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        required={required}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

FormSelect.displayName = 'FormSelect';

export default FormSelect;

