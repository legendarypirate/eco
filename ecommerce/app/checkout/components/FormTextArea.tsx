"use client";

interface FormTextAreaProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  label: string;
  placeholder?: string;
  rows?: number;
}

const FormTextArea = ({
  name,
  value,
  onChange,
  onKeyDown,
  label,
  placeholder = '',
  rows = 3,
}: FormTextAreaProps) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        rows={rows}
        placeholder={placeholder}
      />
    </div>
  );
};

FormTextArea.displayName = 'FormTextArea';

export default FormTextArea;

