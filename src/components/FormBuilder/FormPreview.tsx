import { FormFieldData } from '../../types/form';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';

interface FormPreviewProps {
  title: string;
  description?: string;
  fields: FormFieldData[];
}

const FormPreview = ({ title, description, fields }: FormPreviewProps) => {
  const renderField = (field: FormFieldData) => {
    const labelElement = (
      <Label htmlFor={field.field_name}>
        {field.field_label}
        {field.is_required && <span className="text-red-500 ml-1">*</span>}
      </Label>
    );

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <div key={field.field_name}>
            {labelElement}
            <Input
              id={field.field_name}
              type={field.field_type}
              placeholder={`Enter ${field.field_label.toLowerCase()}`}
              disabled
              className="mt-1"
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.field_name}>
            {labelElement}
            <Textarea
              id={field.field_name}
              placeholder={`Enter ${field.field_label.toLowerCase()}`}
              disabled
              className="mt-1"
              rows={4}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.field_name}>
            {labelElement}
            <Select disabled>
              <SelectTrigger id={field.field_name} className="mt-1">
                <SelectValue placeholder={`Select ${field.field_label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {(field.options || []).map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.field_name} className="flex items-center space-x-2">
            <Checkbox id={field.field_name} disabled />
            <Label
              htmlFor={field.field_name}
              className="text-sm font-normal cursor-not-allowed"
            >
              {field.field_label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-slate-600 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>

      {/* Form Fields */}
      {fields.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>Add fields to see the preview</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map(field => renderField(field))}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button className="w-full" disabled>
          Submit
        </Button>
        <p className="text-xs text-slate-400 text-center mt-2">
          Preview only - form is not functional
        </p>
      </div>
    </div>
  );
};

export default FormPreview;
